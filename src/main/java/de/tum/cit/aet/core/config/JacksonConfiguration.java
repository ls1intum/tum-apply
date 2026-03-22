package de.tum.cit.aet.core.config;

import java.time.LocalTime;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.core.JsonGenerator;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueSerializer;
import tools.jackson.databind.module.SimpleModule;
import tools.jackson.datatype.hibernate7.Hibernate7Module;
import tools.jackson.datatype.hibernate7.Hibernate7Module.Feature;

@Configuration
public class JacksonConfiguration {

    /**
     * Custom serializer for LocalTime to ensure consistent string format.
     * Java Time support is built into Jackson 3.x — this only overrides the LocalTime format.
     */
    @Bean
    public SimpleModule localTimeSerializerModule() {
        SimpleModule module = new SimpleModule("LocalTimeModule");
        module.addSerializer(
            LocalTime.class,
            new ValueSerializer<LocalTime>() {
                @Override
                public void serialize(LocalTime value, JsonGenerator gen, SerializationContext serializers) {
                    gen.writeString(value.toString());
                }
            }
        );
        return module;
    }

    /*
     * Support for Hibernate types in Jackson.
     */
    @Bean
    public Hibernate7Module hibernate7Module() {
        return new Hibernate7Module().configure(Feature.SERIALIZE_IDENTIFIER_FOR_LAZY_NOT_LOADED_OBJECTS, true);
    }
}
