package com.example.demo.grammar;

import com.example.demo.grammar.entity.*;
import com.example.demo.grammar.service.impl.GrammarServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(properties={"spring.jpa.properties.hibernate.generate_statistics=true", "spring.jpa.show-sql=false"})
@Import({GrammarServiceImpl.class, GrammarLoadingIntegrationTest.JsonConfiguration.class})
class GrammarLoadingIntegrationTest {
    @TestConfiguration static class JsonConfiguration {
        @Bean ObjectMapper objectMapper() { return new ObjectMapper(); }
    }
    @Autowired EntityManager entityManager;
    @Autowired GrammarServiceImpl grammar;

    @Test void loadingManyGroupsBatchesQuestionsAndReportsInsteadOfQueryingEachGroup() {
        for(int i=0;i<20;i++) {
            var group=GrammarGroup.builder().groupKey("perf_"+i).title("Group "+i).build();
            entityManager.persist(group);
            entityManager.persist(GrammarQuestion.builder().group(group).questionKey("perf_q_"+i)
                    .questionType("SPOT_ERROR").title("Question").payloadJson("{}").build());
            entityManager.persist(GrammarQuestionReport.builder().group(group).reportKey("perf_r_"+i)
                    .questionTitle("Question").description("Report").build());
        }
        entityManager.flush();
        entityManager.clear();
        var statistics=entityManager.getEntityManagerFactory().unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
        var result=grammar.getAllData();
        assertTrue(result.getGroups().size()>=20);
        assertTrue(result.getGroups().stream().filter(g->g.getId().startsWith("perf_")).allMatch(g->
                g.getQuestions().size()==1 && g.getReports().size()==1));
        assertTrue(statistics.getPrepareStatementCount()<=3,
                "Expected groups + batched questions + batched reports; actual="+statistics.getPrepareStatementCount());
    }
}
