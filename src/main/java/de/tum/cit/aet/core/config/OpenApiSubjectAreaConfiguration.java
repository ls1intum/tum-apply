package de.tum.cit.aet.core.config;

import de.tum.cit.aet.job.constants.SubjectArea;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.media.ArraySchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.parameters.Parameter;
import java.util.Arrays;
import java.util.List;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiSubjectAreaConfiguration {

    @Bean
    OpenApiCustomizer subjectAreaOpenApiCustomizer() {
        List<String> enumValues = Arrays.stream(SubjectArea.values()).map(Enum::name).toList();

        return openApi -> {
            applyEnumToSchemaProperty(openApi, "Job", "subjectArea", enumValues);
            applyEnumToSchemaProperty(openApi, "JobDTO", "subjectArea", enumValues);
            applyEnumToSchemaProperty(openApi, "JobDetailDTO", "subjectArea", enumValues);
            applyEnumToSchemaProperty(openApi, "JobFormDTO", "subjectArea", enumValues);
            applyEnumToSchemaArrayItems(openApi, "AvailableJobsFilterDTO", "subjectAreas", enumValues);
            applyEnumToSchemaArrayItems(openApi, "JobFiltersDTO", "subjectAreas", enumValues);
            applyEnumToQueryArrayParameter(openApi, "/api/jobs/available", "subjectAreas", enumValues);
        };
    }

    private static void applyEnumToSchemaProperty(OpenAPI openApi, String schemaName, String propertyName, List<String> enumValues) {
        Schema<?> propertySchema = getSchemaProperty(openApi, schemaName, propertyName);
        if (propertySchema == null) {
            return;
        }

        setStringEnum(propertySchema, enumValues);
    }

    private static void applyEnumToSchemaArrayItems(OpenAPI openApi, String schemaName, String propertyName, List<String> enumValues) {
        Schema<?> propertySchema = getSchemaProperty(openApi, schemaName, propertyName);
        if (!(propertySchema instanceof ArraySchema arraySchema)) {
            return;
        }

        StringSchema itemSchema = new StringSchema();
        itemSchema.setEnum(enumValues);
        arraySchema.setItems(itemSchema);
    }

    private static void applyEnumToQueryArrayParameter(OpenAPI openApi, String path, String parameterName, List<String> enumValues) {
        PathItem pathItem = openApi.getPaths() != null ? openApi.getPaths().get(path) : null;
        Operation operation = pathItem != null ? pathItem.getGet() : null;
        if (operation == null || operation.getParameters() == null) {
            return;
        }

        operation
            .getParameters()
            .stream()
            .filter(parameter -> parameterName.equals(parameter.getName()))
            .findFirst()
            .ifPresent(parameter -> applyEnumToParameter(parameter, enumValues));
    }

    private static void applyEnumToParameter(Parameter parameter, List<String> enumValues) {
        if (!(parameter.getSchema() instanceof ArraySchema arraySchema)) {
            return;
        }

        StringSchema itemSchema = new StringSchema();
        itemSchema.setEnum(enumValues);
        arraySchema.setItems(itemSchema);
    }

    @SuppressWarnings({ "rawtypes", "unchecked" })
    private static void setStringEnum(Schema<?> schema, List<String> enumValues) {
        Schema rawSchema = schema;
        rawSchema.setType("string");
        rawSchema.setEnum(enumValues);
    }

    private static Schema<?> getSchemaProperty(OpenAPI openApi, String schemaName, String propertyName) {
        Schema<?> schema = openApi.getComponents() != null ? openApi.getComponents().getSchemas().get(schemaName) : null;
        if (schema == null || schema.getProperties() == null) {
            return null;
        }

        return (Schema<?>) schema.getProperties().get(propertyName);
    }
}
