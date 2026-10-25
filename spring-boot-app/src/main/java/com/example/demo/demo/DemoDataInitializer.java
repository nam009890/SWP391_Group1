package com.example.demo.demo;

import com.example.demo.user.entity.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.flashcard.entity.*;
import com.example.demo.flashcard.repository.*;
import com.example.demo.weakvocabulary.entity.*;
import com.example.demo.weakvocabulary.repository.UserWeakVocabularyRepository;
import com.example.demo.study.entity.UserFlashcardReview;
import com.example.demo.study.repository.UserFlashcardReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

/** Opt-in demo duy nhất; không ghi đè mật khẩu, vai trò hoặc tiến độ khi khởi động lại. */
@Component
@Profile("demo & !prod & !production")
@ConditionalOnProperty(name="app.demo.seed-enabled",havingValue="true")
@RequiredArgsConstructor
public class DemoDataInitializer implements ApplicationRunner {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final DeckRepository decks;
    private final FlashcardRepository cards;
    private final UserWeakVocabularyRepository weak;
    private final UserFlashcardReviewRepository reviews;
    private final Environment environment;

    @Override @Transactional
    public void run(ApplicationArguments arguments) {
        // Kiểm tra tất cả trước khi tạo account; transaction rollback nếu có xung đột.
        String adminPassword=password("DEMO_ADMIN_PASSWORD");
        String learnerPassword=password("DEMO_LEARNER_PASSWORD");
        String lockedPassword=password("DEMO_LOCKED_PASSWORD");
        for(String email:List.of("admin@studye.test","learner1@studye.test","learner2@studye.test","locked@studye.test"))
            users.findByEmail(email).ifPresent(u->{if(!u.isDemoAccount())throw new IllegalStateException("Demo email already belongs to an ordinary account; provisioning stopped.");});
        create("admin@studye.test","StudyE Administrator","ROLE_ADMIN",false,adminPassword,0);
        create("learner1@studye.test","Demo Learner One","ROLE_USER",false,learnerPassword,1);
        create("learner2@studye.test","Demo Learner Two","ROLE_USER",false,learnerPassword,2);
        create("locked@studye.test","Locked Demo User","ROLE_USER",true,lockedPassword,0);
    }
    private String password(String key) {
        String value=environment.getProperty(key,"");
        com.example.demo.user.service.ProfileService.validatePassword(value);
        return value;
    }
    private void create(String email,String name,String role,boolean locked,String password,int learner) {
        var existing=users.findByEmail(email);
        if(existing.isPresent()) {
            var stub=existing.get();
            // SQL clean-install chỉ tạo stub demo chưa có mật khẩu; không reset account đã cấp.
            if(stub.isDemoAccount() && stub.getPassword()==null && "LOCAL".equals(stub.getProvider())) {
                stub.setPassword(encoder.encode(password));
                users.saveAndFlush(stub);
            }
            return;
        }
        var user=users.saveAndFlush(User.builder().email(email).name(name).provider("LOCAL").role(role)
                .password(encoder.encode(password)).demoAccount(true).locked(locked)
                .lockedAt(locked?LocalDateTime.now(ZoneOffset.UTC):null)
                .lockedReason(locked?"Local demonstration account":null).build());
        if(learner==0)return;
        addDeck(user,"Travel — Learner "+learner,DeckVisibility.PUBLIC);
        addDeck(user,"Private study — Learner "+learner,DeckVisibility.PRIVATE);
    }
    private void addDeck(User user,String name,DeckVisibility visibility) {
        var deck=decks.saveAndFlush(Deck.builder().owner(user).name(name).visibility(visibility)
                .description("Local demo content; no live AI history.").build());
        String[][] samples={{"passport","hộ chiếu","Keep your passport safe."},{"journey","chuyến đi","The journey begins at dawn."},
                {"ticket","vé","Please show your ticket."},{"luggage","hành lý","My luggage is heavy."},{"airport","sân bay","The airport is busy today."}};
        for(String[] item:samples){
            var card=cards.saveAndFlush(Flashcard.builder().deck(deck).vocabulary(item[0]).meaning(item[1]).exampleSentence(item[2]).build());
            weak.save(UserWeakVocabulary.builder().user(user).flashcard(card).manualMarked(true)
                    .detectionReason(WeakDetectionReason.MANUAL_MARK).build());
            // Trạng thái mới, chưa ôn: không bịa lịch sử Study hay đánh giá SM-2.
            reviews.save(UserFlashcardReview.builder().user(user).flashcard(card).easeFactor(2.5)
                    .repetitionCount(0).intervalDays(0).nextReviewDate(LocalDateTime.now(ZoneOffset.UTC)).build());
        }
    }
}
