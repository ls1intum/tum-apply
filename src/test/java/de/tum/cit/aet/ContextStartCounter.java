package de.tum.cit.aet;

import java.util.concurrent.atomic.AtomicInteger;
import org.jetbrains.annotations.NotNull;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Component;

@Component
public class ContextStartCounter implements ApplicationListener<ContextRefreshedEvent> {

    private static final AtomicInteger START_COUNT = new AtomicInteger(0);

    public static int getCount() {
        return START_COUNT.get();
    }

    @Override
    public void onApplicationEvent(@NotNull ContextRefreshedEvent event) {
        int count = START_COUNT.incrementAndGet();
        System.out.println("📦 ApplicationContext started #" + count);
    }
}
