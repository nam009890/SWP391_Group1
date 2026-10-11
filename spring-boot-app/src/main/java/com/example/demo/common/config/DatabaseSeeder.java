package com.example.demo.common.config;

import com.example.demo.flashcard.entity.Deck;
import com.example.demo.flashcard.entity.Flashcard;
import com.example.demo.flashcard.repository.DeckRepository;
import com.example.demo.flashcard.repository.FlashcardRepository;
import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DeckRepository deckRepository;
    private final FlashcardRepository flashcardRepository;

    @Override
    public void run(String... args) throws Exception {
        // Chỉ seed data nếu chưa có bộ thẻ public nào để tránh duplicate mỗi lần restart
        if (deckRepository.findPublicDecksWithSearch("").isEmpty()) {
            
            // 1. Tạo 2 người dùng cộng đồng (nếu chưa có)
            User user1 = userRepository.findByEmail("teacher.jane@example.com").orElseGet(() -> {
                User u = User.builder()
                        .email("teacher.jane@example.com")
                        .name("Teacher Jane")
                        .provider("LOCAL")
                        .role("ROLE_USER")
                        .build();
                return userRepository.save(u);
            });

            User user2 = userRepository.findByEmail("ielts.master@example.com").orElseGet(() -> {
                User u = User.builder()
                        .email("ielts.master@example.com")
                        .name("IELTS Master")
                        .provider("LOCAL")
                        .role("ROLE_USER")
                        .build();
                return userRepository.save(u);
            });

            // 2. Tạo Deck 1 (Public)
            Deck deck1 = Deck.builder()
                    .name("TOEFL Essential Vocabulary")
                    .description("The 10 most common words you must know for the TOEFL exam.")
                    .isPublic(true)
                    .user(user1)
                    .build();
            deckRepository.save(deck1);

            flashcardRepository.saveAll(List.of(
                Flashcard.builder().vocabulary("abundant").meaning("dồi dào, nhiều").phonetic("/əˈbʌn.dənt/").exampleSentence("Rainfall is abundant in the region.").deck(deck1).build(),
                Flashcard.builder().vocabulary("ambiguous").meaning("mơ hồ, khó hiểu").phonetic("/æmˈbɪɡ.ju.əs/").exampleSentence("His reply to my question was somewhat ambiguous.").deck(deck1).build(),
                Flashcard.builder().vocabulary("coherent").meaning("mạch lạc, chặt chẽ").phonetic("/koʊˈhɪr.ənt/").exampleSentence("She gave a clear and coherent explanation.").deck(deck1).build()
            ));

            // 3. Tạo Deck 2 (Public)
            Deck deck2 = Deck.builder()
                    .name("IELTS Band 8 Speaking")
                    .description("Advanced idioms and collocations to boost your speaking score.")
                    .isPublic(true)
                    .user(user2)
                    .build();
            deckRepository.save(deck2);

            flashcardRepository.saveAll(List.of(
                Flashcard.builder().vocabulary("once in a blue moon").meaning("hiếm khi").phonetic("").exampleSentence("I only go to the cinema once in a blue moon.").deck(deck2).build(),
                Flashcard.builder().vocabulary("a piece of cake").meaning("rất dễ dàng").phonetic("").exampleSentence("The English test was a piece of cake.").deck(deck2).build(),
                Flashcard.builder().vocabulary("cost an arm and a leg").meaning("rất đắt đỏ").phonetic("").exampleSentence("This sports car cost an arm and a leg.").deck(deck2).build()
            ));

            log.info("✅ Seeded test community decks successfully!");
        }

        // 4. Phục hồi các bộ thẻ cũ (tạo trước khi có tính năng User)
        List<Deck> allDecks = deckRepository.findAll();
        User googleUser = userRepository.findAll().stream()
                .filter(u -> "GOOGLE".equals(u.getProvider()))
                .findFirst()
                .orElse(null);

        if (googleUser != null) {
            boolean updated = false;
            for (Deck deck : allDecks) {
                if (deck.getUser() == null) {
                    deck.setUser(googleUser);
                    deckRepository.save(deck);
                    updated = true;
                }
            }
            if (updated) {
                log.info("✅ Phục hồi thành công các bộ thẻ cũ cho tài khoản Google của bạn!");
            }
        }
    }
}
