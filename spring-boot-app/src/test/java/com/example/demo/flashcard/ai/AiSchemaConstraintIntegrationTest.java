package com.example.demo.flashcard.ai;

import com.example.demo.flashcard.ai.entity.AiGenerationSource;
import com.example.demo.flashcard.ai.entity.AiGenerationStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import java.nio.file.*;
import java.sql.*;
import java.time.*;
import java.util.*;
import java.util.regex.*;
import java.util.stream.Collectors;
import static org.junit.jupiter.api.Assertions.*;

/** Executes extracted application DDL/CHECK expressions in isolated H2, never application SQL Server.
 * SQL Server batch/catalog/transaction syntax is separately checked with ScriptDom, not emulated here. */
public class AiSchemaConstraintIntegrationTest {
    static final String[] CHECKS={"CK_ai_source","CK_ai_status","CK_ai_usage","CK_ai_expiry",
            "CK_ai_generation_batches_preview_json","CK_ai_generation_batches_commit_json"};
    Connection db;
    String clean,repair,legacy;

    static String read(String file) throws Exception {
        Path root=Files.isDirectory(Path.of("db"))?Path.of("db"):Path.of("..","db");
        return Files.readString(root.resolve(file));
    }
    static String expression(String sql,String name) {
        Matcher m=Pattern.compile("(?i)CONSTRAINT\\s+"+Pattern.quote(name)+"\\s+CHECK\\s*\\(").matcher(sql);
        assertTrue(m.find(),"Missing CHECK "+name);
        int start=m.end(),depth=1,end=start;
        for(;end<sql.length() && depth>0;end++) {
            if(sql.charAt(end)=='(')depth++;else if(sql.charAt(end)==')')depth--;
        }
        assertEquals(0,depth,"Unbalanced CHECK "+name);
        return sql.substring(start,end-1);
    }
    static Set<String> enumLiterals(String sql,String name) {
        var matcher=Pattern.compile("'([A-Z_]+)'").matcher(expression(sql,name));
        Set<String> values=new HashSet<>();while(matcher.find())values.add(matcher.group(1));return values;
    }
    public static Timestamp utcNow() { return Timestamp.from(Instant.now()); }
    public static int isJson(String text) {
        if(text==null)return 0;
        try { var node=new ObjectMapper().reader().with(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_TRAILING_TOKENS).readTree(text);
            return node!=null && (node.isObject() || node.isArray())?1:0;
        }catch(Exception e){return 0;}
    }
    @BeforeEach void setup() throws Exception {
        clean=read("database.sql");repair=read("migrations/20261025_ai_generation_v3_constraints.sql");
        legacy=read("migrations/20261025_ai_flashcard_generation_v2.sql");
        db=DriverManager.getConnection("jdbc:h2:mem:"+UUID.randomUUID()+";MODE=MSSQLServer","sa","");
        execute("CREATE SCHEMA dbo");
        execute("CREATE ALIAS SYSUTCDATETIME FOR '"+getClass().getName()+".utcNow'");
        execute("CREATE ALIAS ISJSON FOR '"+getClass().getName()+".isJson'");
        execute("CREATE TABLE dbo.users(id BIGINT PRIMARY KEY)");execute("INSERT INTO dbo.users VALUES(1)");
        execute("CREATE TABLE dbo.decks(id BIGINT PRIMARY KEY)");execute("INSERT INTO dbo.decks VALUES(1)");
        int start=clean.indexOf("CREATE TABLE dbo.ai_generation_batches (");
        assertTrue(start>=0);int end=clean.indexOf("\n);",start);assertTrue(end>start);
        // H2 has no SQL Server named DEFAULT constraint syntax; keep its value,
        // and execute all actual PK/FK/UQ/CHECK expressions without rewriting them.
        execute(clean.substring(start,end+3).replaceAll("CONSTRAINT\\s+DF_\\w+\\s+DEFAULT","DEFAULT"));
    }
    @AfterEach void close() throws Exception { if(db!=null)db.close(); }
    void execute(String sql) throws SQLException {try(var statement=db.createStatement()){statement.execute(sql);}}
    String insert(String source,String status,String requestId) throws SQLException {
        String id=UUID.randomUUID().toString();
        try(var p=db.prepareStatement("INSERT INTO dbo.ai_generation_batches(id,user_id,deck_id,request_id,request_fingerprint,source,prompt_version,status,created_at,expires_at,lease_until) VALUES(?,1,1,?,'fingerprint',?,'test',?,?,?,?)")) {
            var now=LocalDateTime.now();p.setString(1,id);p.setString(2,requestId);p.setString(3,source);p.setString(4,status);
            p.setObject(5,now);p.setObject(6,now.plusMinutes(20));p.setObject(7,now.plusMinutes(2));p.executeUpdate();
        }return id;
    }
    long count() throws SQLException {try(var s=db.createStatement();var r=s.executeQuery("SELECT COUNT(*) FROM dbo.ai_generation_batches")){r.next();return r.getLong(1);}}
    void repairChecks() throws SQLException {
        for(String check:CHECKS){execute("ALTER TABLE dbo.ai_generation_batches DROP CONSTRAINT "+check);
            execute("ALTER TABLE dbo.ai_generation_batches ADD CONSTRAINT "+check+" CHECK("+expression(repair,check)+")");}
    }

    @Test void enumsExactlyMatchCleanAndRepairCheckContracts() {
        var sources=Arrays.stream(AiGenerationSource.values()).map(Enum::name).collect(Collectors.toSet());
        var statuses=Arrays.stream(AiGenerationStatus.values()).map(Enum::name).collect(Collectors.toSet());
        for(String sql:List.of(clean,repair)) {
            assertEquals(sources,enumLiterals(sql,"CK_ai_source"));assertEquals(statuses,enumLiterals(sql,"CK_ai_status"));
        }
        for(String check:CHECKS)assertEquals(expression(clean,check).replaceAll("\\s+",""),expression(repair,check).replaceAll("\\s+",""),check);
        assertFalse(sources.contains("DISABLED"));
    }
    @Test void reproducesOldGeminiFailureAndRepairPreservesRowsAndIsRepeatable() throws Exception {
        execute("ALTER TABLE dbo.ai_generation_batches DROP CONSTRAINT CK_ai_source");
        execute("ALTER TABLE dbo.ai_generation_batches ADD CONSTRAINT CK_ai_source CHECK("+expression(legacy,"CK_ai_source")+")");
        String old=insert("OPENAI","COMMITTED",UUID.randomUUID().toString());
        SQLException failure=assertThrows(SQLException.class,()->insert("GEMINI","PENDING",UUID.randomUUID().toString()));
        assertTrue(failure.getMessage().toUpperCase(Locale.ROOT).contains("CK_AI_SOURCE"));assertEquals(1,count());
        repairChecks();assertEquals(1,count());
        insert("GEMINI","PENDING",UUID.randomUUID().toString());insert("DEMO_LIBRARY","READY",UUID.randomUUID().toString());
        repairChecks();assertEquals(3,count());
        try(var p=db.prepareStatement("SELECT source,status FROM dbo.ai_generation_batches WHERE id=?")){p.setString(1,old);
            try(var r=p.executeQuery()){assertTrue(r.next());assertEquals("OPENAI",r.getString(1));assertEquals("COMMITTED",r.getString(2));}}
    }
    @Test void databaseAcceptsEveryEnumAndRejectsUnknownSourceStatusAndDuplicateRequest() throws Exception {
        for(var source:AiGenerationSource.values())for(var status:AiGenerationStatus.values())insert(source.name(),status.name(),UUID.randomUUID().toString());
        assertEquals(15,count());
        for(String bad:List.of("DISABLED","GOOGLE","DEMO"))assertThrows(SQLException.class,()->insert(bad,"PENDING",UUID.randomUUID().toString()));
        assertThrows(SQLException.class,()->insert("GEMINI","GENERATING",UUID.randomUUID().toString()));
        String request=UUID.randomUUID().toString();insert("OPENAI","READY",request);
        assertThrows(SQLException.class,()->insert("GEMINI","READY",request));
    }
    @Test void usageExpiryAndJsonChecksMatchCurrentProviderContract() throws Exception {
        String id=insert("GEMINI","PENDING",UUID.randomUUID().toString());
        for(int attempts=0;attempts<=2;attempts++)execute("UPDATE dbo.ai_generation_batches SET provider_attempts="+attempts+" WHERE id='"+id+"'");
        for(String assignment:List.of("provider_attempts=3","provider_attempts=-1","input_tokens=-1","output_tokens=-1",
                "expires_at=DATEADD(DAY,-1,created_at)","preview_json='broken'","commit_json='broken'"))
            assertThrows(SQLException.class,()->execute("UPDATE dbo.ai_generation_batches SET "+assignment+" WHERE id='"+id+"'"),assignment);
        execute("UPDATE dbo.ai_generation_batches SET input_tokens=0,output_tokens=100,preview_json='{}',commit_json='{}' WHERE id='"+id+"'");
    }
    @Test void repairScriptIsValidatedAndDoesNotResetOrRewriteApplicationData() {
        assertFalse(Pattern.compile("(?im)^\\s*(?:DROP\\s+(?:DATABASE|TABLE)|TRUNCATE|DELETE\\b|UPDATE\\s+dbo\\.|INSERT\\s+(?:INTO\\s+)?dbo\\.)").matcher(repair).find());
        assertTrue(repair.contains("WITH(TABLOCKX,HOLDLOCK)"));assertTrue(repair.contains("ROLLBACK TRANSACTION"));
        assertTrue(repair.contains("is_disabled=0 AND is_not_trusted=0"));
        for(String check:CHECKS)assertTrue(repair.contains("WITH CHECK ADD CONSTRAINT "+check));
    }
}
