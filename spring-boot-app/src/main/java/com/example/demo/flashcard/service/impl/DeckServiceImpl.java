package com.example.demo.flashcard.service.impl;

import com.example.demo.common.exception.ResourceNotFoundException;
import com.example.demo.flashcard.dto.DeckDto;
import com.example.demo.flashcard.dto.DeckRequest;
import com.example.demo.flashcard.dto.DeckResponse;
import com.example.demo.flashcard.entity.Deck;
import com.example.demo.flashcard.entity.DeckVisibility;
import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.DeckRepository;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.flashcard.service.DeckAccessPolicy;
import com.example.demo.flashcard.service.DeckService;
import com.example.demo.user.repository.UserRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DeckServiceImpl implements DeckService {

    private final DeckRepository deckRepository;
    private final FlashcardRepository flashcards;
    private final UserRepository users;
    private final DeckAccessPolicy access;

    public DeckServiceImpl(DeckRepository deckRepository,
            FlashcardRepository flashcards,
            UserRepository users,
            DeckAccessPolicy access) {
        this.deckRepository = deckRepository;
        this.flashcards = flashcards;
        this.users = users;
        this.access = access;
    }

    @Override
    public List<DeckDto> getAllDecksWithCount() {
        Long uid = access.requireUserId();
        return deckRepository.findAll((Specification<Deck>) (root, query, cb) ->
                cb.and(cb.isFalse(root.get("deleted")), cb.or(cb.equal(root.get("visibility"), DeckVisibility.PUBLIC),
                        cb.equal(root.get("owner").get("id"), uid))))
                .stream().map(d -> new DeckDto(d.getId(), d.getName(), d.getDescription(), flashcards.countByDeckId(d.getId()))).toList();
    }

    @Override
    @Transactional
    public DeckResponse createDeck(DeckRequest request) {
        validate(request);
        // Owner lấy từ JWT; deck mới mặc định private, không nhận ownerId từ client.
        var owner = users.findById(access.requireUserId()).orElseThrow();
        Deck deck = Deck.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .owner(owner)
                .visibility(request.getVisibility() == null ? DeckVisibility.PRIVATE : request.getVisibility())
                .build();
        Deck savedDeck = deckRepository.save(deck);
        return mapToResponse(savedDeck);
    }

    @Override
    public DeckResponse getDeckById(Long id) {
        Deck deck = access.requireViewAccess(id, access.currentUserId());
        return mapToResponse(deck);
    }

    private DeckResponse mapToResponse(Deck deck) {
        return DeckResponse.builder()
                .id(deck.getId())
                .name(deck.getName())
                .description(deck.getDescription())
                .visibility(deck.getVisibility())
                .ownerId(deck.getOwner() == null ? null : deck.getOwner().getId())
                .ownerName(deck.getOwner() == null ? "Community" : deck.getOwner().getName())
                .isOwner(access.canManageDeck(deck, access.currentUserId()))
                .flashcardCount(flashcards.countByDeckId(deck.getId()))
                .createdAt(deck.getCreatedAt()).updatedAt(deck.getUpdatedAt())
                .build();
    }

    public DeckResponse getPublic(Long id) {
        return mapToResponse(access.requireViewAccess(id, null));
    }

    @Transactional
    public DeckResponse update(Long id, DeckRequest request) {
        Deck deck = access.requireOwner(id);
        validate(request);
        deck.setName(request.getName().trim());
        deck.setDescription(request.getDescription());
        if (request.getVisibility() != null) deck.setVisibility(request.getVisibility());
        return mapToResponse(deckRepository.saveAndFlush(deck));
    }

    @Transactional
    public DeckResponse visibility(Long id, DeckVisibility visibility) {
        if (visibility == null) throw new IllegalArgumentException("Visibility is required");
        Deck deck = access.requireOwner(id);
        deck.setVisibility(visibility);
        return mapToResponse(deckRepository.saveAndFlush(deck));
    }

    @Transactional
    public void delete(Long id) {
        Deck deck = access.requireOwner(id);
        // Soft delete giữ nguyên các quan hệ và lịch sử học.
        deck.setDeleted(true);
        deckRepository.save(deck);
    }

    private void validate(DeckRequest request) {
        if (request.getName() == null || request.getName().isBlank() || request.getName().trim().length() > 255)
            throw new IllegalArgumentException("Deck name must contain 1 to 255 characters");
        if (request.getDescription() != null && request.getDescription().length() > 5000)
            throw new IllegalArgumentException("Description must not exceed 5000 characters");
    }

    @Transactional(readOnly = true)
    public Page<DeckResponse> list(boolean mine, String keyword,
            DeckVisibility visibility, String sort, int page, int size) {
        Long uid = mine ? access.requireUserId() : access.currentUserId();
        Specification<Deck> spec = (root, query, cb) -> cb.and(cb.isFalse(root.get("deleted")),
                mine ? cb.equal(root.get("owner").get("id"), uid) : cb.equal(root.get("visibility"), DeckVisibility.PUBLIC));
        if (mine && visibility != null) spec = spec.and((root, query, cb) -> cb.equal(root.get("visibility"), visibility));
        if (keyword != null && !keyword.isBlank()) {
            String term = "%" + keyword.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            spec = spec.and((root, query, cb) -> cb.or(cb.like(cb.lower(root.get("name")), term, '\\'), cb.like(cb.lower(root.get("description")), term, '\\')));
        }
        var order = switch (sort == null ? "NEWEST" : sort) {
            case "OLDEST" -> Sort.by("createdAt").ascending();
            case "NAME_ASC" -> Sort.by("name").ascending();
            case "NAME_DESC" -> Sort.by("name").descending();
            case "MOST_FLASHCARDS" -> Sort.unsorted();
            case "NEWEST" -> Sort.by("createdAt").descending();
            default -> throw new IllegalArgumentException("Invalid deck sort");
        };
        if ("MOST_FLASHCARDS".equals(sort)) spec = spec.and((root, query, cb) -> {
            if (!Long.class.equals(query.getResultType())) {
                var count = query.subquery(Long.class);
                var card = count.from(Flashcard.class);
                count.select(cb.count(card)).where(cb.equal(card.get("deck"), root));
                query.orderBy(cb.desc(count), cb.desc(root.get("id")));
            }
            return cb.conjunction();
        });
        if (order.isSorted()) order = order.and(Sort.by("id").descending());
        var result = deckRepository.findAll(spec, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 48), order));
        // Đếm thẻ theo lô để không tạo một query cho mỗi card trên Dashboard.
        Map<Long, Long> counts = new HashMap<>();
        if (!result.isEmpty()) flashcards.countsByDeckIds(result.stream().map(Deck::getId).toList())
                .forEach(row -> counts.put((Long) row[0], (Long) row[1]));
        return result.map(d -> DeckResponse.builder().id(d.getId()).name(d.getName()).description(d.getDescription())
                .visibility(d.getVisibility()).ownerId(d.getOwner() == null ? null : d.getOwner().getId())
                .ownerName(d.getOwner() == null ? "Community" : d.getOwner().getName()).isOwner(access.canManageDeck(d, uid))
                .flashcardCount(counts.getOrDefault(d.getId(), 0L)).createdAt(d.getCreatedAt()).updatedAt(d.getUpdatedAt()).build());
    }
}
