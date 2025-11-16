package de.tum.cit.aet.core.config;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration for serving static image files from the file system.
 * Images are served directly from disk for better performance and browser
 * caching.
 */
@Configuration
public class ImageStaticResourceConfiguration implements WebMvcConfigurer {

    @Value("${aet.storage.image-root:/storage/images}")
    private String imageRoot;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path imagePath = Paths.get(imageRoot).toAbsolutePath().normalize();

        // Serve job banners and default images as public static resources
        // These are publicly accessible for anyone browsing job listings
        registry
                .addResourceHandler("/images/**")
                .addResourceLocations("file:" + imagePath.toString() + "/")
                .setCacheControl(
                        CacheControl.maxAge(Duration.ofDays(30)) // Cache for 30 days
                                .cachePublic() // Allow CDN/proxy caching
                                .mustRevalidate() // Check with server if expired
                );
    }
}
