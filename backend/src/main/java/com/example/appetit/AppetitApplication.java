package com.example.appetit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AppetitApplication {

    public static void main(String[] args) {
        SpringApplication.run(AppetitApplication.class, args);
    }

}
