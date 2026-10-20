package info.mm.debate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@EnableMongoRepositories
public class DebateServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(DebateServerApplication.class, args);
    }
}

