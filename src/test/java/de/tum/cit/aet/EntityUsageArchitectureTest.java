package de.tum.cit.aet;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.AnnotatedType;
import java.lang.reflect.Field;
import java.lang.reflect.GenericArrayType;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.lang.reflect.WildcardType;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.Entity;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;

import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.domain.JavaMethod;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchCondition;
import com.tngtech.archunit.lang.ConditionEvents;

/**
 * Architecture tests verifying proper DTO usage and entity encapsulation.
 * <p>
 * These tests ensure that:
 * <ul>
 * <li>REST controllers do not return @Entity types directly (should return DTOs instead)</li>
 * <li>REST controllers do not accept @Entity types in @RequestBody/@RequestPart parameters</li>
 * <li>DTO classes do not contain fields that reference @Entity types</li>
 * </ul>
 * <p>
 * Adapted from the Artemis project's architecture tests. Unlike Artemis (which has many violations
 * and uses configurable thresholds per module), TUMApply enforces strict limits that should be
 * reduced to 0 over time.
 *
 * @see <a href="https://github.com/ls1intum/Artemis">Artemis (original architecture tests)</a>
 */
class EntityUsageArchitectureTest {

    private static final String BASE_PACKAGE = "de.tum.cit.aet";

    // TODO: Reduce all violation counts to 0 by replacing entity references with DTOs.
    // When you fix a violation, lower the corresponding count.
    private static final int MAX_ENTITY_RETURN_VIOLATIONS = 0;
    private static final int MAX_ENTITY_INPUT_VIOLATIONS = 0;
    private static final int MAX_DTO_ENTITY_FIELD_VIOLATIONS = 1; // JobDetailDTO.researchGroup -> ResearchGroup

    private static JavaClasses productionClasses;

    @BeforeAll
    static void loadClasses() {
        productionClasses = new ClassFileImporter()
            .withImportOption(new ImportOption.DoNotIncludeTests())
            .importPackages(BASE_PACKAGE);
    }

    /**
     * Verifies that REST controllers do not return @Entity types directly.
     * Controllers should always return DTOs to avoid exposing internal persistence models.
     */
    @Test
    void restControllersShouldNotReturnEntities() {
        List<String> violations = new ArrayList<>();

        var condition = new ArchCondition<JavaClass>("not return @Entity types from REST controller methods") {

            @Override
            public void check(JavaClass controllerClass, ConditionEvents events) {
                Class<?> reflectedController = controllerClass.reflect();

                for (JavaMethod archMethod : controllerClass.getMethods()) {
                    if (!archMethod.getOwner().equals(controllerClass)) {
                        continue;
                    }

                    Method reflectedMethod = findMatchingDeclaredMethod(reflectedController, archMethod);
                    if (reflectedMethod == null) {
                        continue;
                    }

                    Type returnType = reflectedMethod.getGenericReturnType();
                    Optional<Class<?>> entityType = findFirstEntityType(returnType);

                    if (entityType.isEmpty()) {
                        entityType = findFirstEntityType(reflectedMethod.getAnnotatedReturnType().getType());
                    }

                    if (entityType.isPresent()) {
                        violations.add(String.format("%s#%s returns entity '%s' (return type: %s)",
                            controllerClass.getSimpleName(), archMethod.getName(),
                            entityType.get().getSimpleName(), returnType.getTypeName()));
                    }
                }
            }
        };

        classes().that().resideInAPackage(BASE_PACKAGE + "..")
            .and().areAnnotatedWith(RestController.class)
            .should(condition)
            .allowEmptyShould(true)
            .check(productionClasses);

        assertThat(violations)
            .as("Entity return type violations (max allowed: %d, found: %d). "
                + "Reduce to 0 by using DTOs instead of entities.\nViolations:\n%s",
                MAX_ENTITY_RETURN_VIOLATIONS, violations.size(), String.join("\n", violations))
            .hasSizeLessThanOrEqualTo(MAX_ENTITY_RETURN_VIOLATIONS);
    }

    /**
     * Verifies that REST controllers do not accept @Entity types in @RequestBody or @RequestPart parameters.
     * Controllers should accept DTOs instead of entities as input.
     */
    @Test
    void restControllersShouldNotAcceptEntitiesAsInput() {
        List<String> violations = new ArrayList<>();

        var condition = new ArchCondition<JavaClass>("not use @Entity types in @RequestBody/@RequestPart parameters") {

            @Override
            public void check(JavaClass controllerClass, ConditionEvents events) {
                Class<?> reflectedController = controllerClass.reflect();

                for (JavaMethod archMethod : controllerClass.getMethods()) {
                    if (!archMethod.getOwner().equals(controllerClass)) {
                        continue;
                    }

                    Method reflectedMethod = findMatchingDeclaredMethod(reflectedController, archMethod);
                    if (reflectedMethod == null) {
                        continue;
                    }

                    Parameter[] parameters = reflectedMethod.getParameters();
                    AnnotatedType[] annotatedParameterTypes = reflectedMethod.getAnnotatedParameterTypes();

                    for (int i = 0; i < parameters.length; i++) {
                        Parameter parameter = parameters[i];

                        if (!parameter.isAnnotationPresent(RequestBody.class) && !parameter.isAnnotationPresent(RequestPart.class)) {
                            continue;
                        }

                        Type parameterType = parameter.getParameterizedType();
                        Optional<Class<?>> entityType = findFirstEntityType(parameterType);

                        if (entityType.isEmpty()) {
                            entityType = findFirstEntityType(annotatedParameterTypes[i].getType());
                        }

                        if (entityType.isPresent()) {
                            String annotation = parameter.isAnnotationPresent(RequestBody.class) ? "@RequestBody" : "@RequestPart";
                            violations.add(String.format("%s#%s accepts entity '%s' via %s (parameter type: %s)",
                                controllerClass.getSimpleName(), archMethod.getName(),
                                entityType.get().getSimpleName(), annotation, parameterType.getTypeName()));
                        }
                    }
                }
            }
        };

        classes().that().resideInAPackage(BASE_PACKAGE + "..")
            .and().areAnnotatedWith(RestController.class)
            .should(condition)
            .allowEmptyShould(true)
            .check(productionClasses);

        assertThat(violations)
            .as("Entity input violations (max allowed: %d, found: %d). "
                + "Reduce to 0 by using DTOs instead of entities.\nViolations:\n%s",
                MAX_ENTITY_INPUT_VIOLATIONS, violations.size(), String.join("\n", violations))
            .hasSizeLessThanOrEqualTo(MAX_ENTITY_INPUT_VIOLATIONS);
    }

    /**
     * Verifies that DTO classes do not contain fields that reference @Entity types.
     * <p>
     * This prevents the "lazy wrapper" anti-pattern where DTOs simply wrap entity objects.
     * DTOs should only contain primitive types, date/time types, enums, and other DTOs.
     */
    @Test
    void dtosShouldNotContainEntityFields() {
        List<String> violations = new ArrayList<>();

        var condition = new ArchCondition<JavaClass>("not contain fields that reference @Entity types") {

            @Override
            public void check(JavaClass dtoClass, ConditionEvents events) {
                Class<?> reflectedDto = dtoClass.reflect();

                for (Field field : reflectedDto.getDeclaredFields()) {
                    if (field.isSynthetic()) {
                        continue;
                    }

                    Type fieldType = field.getGenericType();
                    Optional<Class<?>> entityType = findFirstEntityType(fieldType);

                    if (entityType.isPresent()) {
                        violations.add(String.format("%s.%s references entity '%s' (field type: %s)",
                            dtoClass.getSimpleName(), field.getName(),
                            entityType.get().getSimpleName(), fieldType.getTypeName()));
                    }
                }
            }
        };

        classes().that().resideInAPackage(BASE_PACKAGE + "..")
            .and().haveSimpleNameEndingWith("DTO")
            .should(condition)
            .allowEmptyShould(true)
            .check(productionClasses);

        assertThat(violations)
            .as("DTO entity field violations (max allowed: %d, found: %d). "
                + "Reduce to 0 by removing entity references from DTOs.\nViolations:\n%s",
                MAX_DTO_ENTITY_FIELD_VIOLATIONS, violations.size(), String.join("\n", violations))
            .hasSizeLessThanOrEqualTo(MAX_DTO_ENTITY_FIELD_VIOLATIONS);
    }

    /**
     * Matches an ArchUnit JavaMethod to the corresponding reflective Method on the controller class.
     */
    private static Method findMatchingDeclaredMethod(Class<?> owner, JavaMethod archMethod) {
        String name = archMethod.getName();
        Class<?>[] rawParamTypes = archMethod.getRawParameterTypes().stream()
            .map(JavaClass::reflect)
            .toArray(Class<?>[]::new);

        try {
            return owner.getDeclaredMethod(name, rawParamTypes);
        }
        catch (NoSuchMethodException ex) {
            for (Method method : owner.getDeclaredMethods()) {
                if (!method.getName().equals(name) || method.getParameterCount() != rawParamTypes.length) {
                    continue;
                }
                Class<?>[] actual = method.getParameterTypes();
                boolean same = true;
                for (int i = 0; i < actual.length; i++) {
                    if (!actual[i].equals(rawParamTypes[i])) {
                        same = false;
                        break;
                    }
                }
                if (same) {
                    return method;
                }
            }
            return null;
        }
    }

    /**
     * Recursively inspects a Java reflection Type to find the first @Entity class.
     * Handles nested generics, arrays, generic arrays, and wildcards.
     */
    private static Optional<Class<?>> findFirstEntityType(Type type) {
        return switch (type) {
            case null -> Optional.empty();
            case Class<?> cls -> {
                if (cls.isAnnotationPresent(Entity.class)) {
                    yield Optional.of(cls);
                }
                if (cls.isArray()) {
                    yield findFirstEntityType(cls.getComponentType());
                }
                yield Optional.empty();
            }
            case ParameterizedType pt -> {
                for (Type arg : pt.getActualTypeArguments()) {
                    Optional<Class<?>> found = findFirstEntityType(arg);
                    if (found.isPresent()) {
                        yield found;
                    }
                }
                yield findFirstEntityType(pt.getRawType());
            }
            case GenericArrayType gat -> findFirstEntityType(gat.getGenericComponentType());
            case WildcardType wt -> {
                for (Type upper : wt.getUpperBounds()) {
                    Optional<Class<?>> found = findFirstEntityType(upper);
                    if (found.isPresent()) {
                        yield found;
                    }
                }
                for (Type lower : wt.getLowerBounds()) {
                    Optional<Class<?>> found = findFirstEntityType(lower);
                    if (found.isPresent()) {
                        yield found;
                    }
                }
                yield Optional.empty();
            }
            default -> Optional.empty();
        };
    }
}
