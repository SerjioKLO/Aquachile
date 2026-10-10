package cl.duoc.aquachile.evaluacion;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import javax.sql.DataSource;

@SpringBootTest(properties = {
    "spring.sql.init.mode=never",
    "spring.jpa.hibernate.ddl-auto=none"
})
class EvaluacionApplicationTests {

    @MockitoBean
    private DataSource dataSource;

    @Test
    void contextLoads() {
    }
}
