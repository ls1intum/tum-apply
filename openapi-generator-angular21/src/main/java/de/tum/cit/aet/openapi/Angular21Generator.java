/*
 * Copyright (c) 2024 TUM Applied Education Technologies (AET)
 * Licensed under the MIT License
 */
package de.tum.cit.aet.openapi;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import org.openapitools.codegen.*;
import org.openapitools.codegen.languages.TypeScriptAngularClientCodegen;
import org.openapitools.codegen.model.ModelMap;
import org.openapitools.codegen.model.ModelsMap;
import org.openapitools.codegen.model.OperationMap;
import org.openapitools.codegen.model.OperationsMap;
import org.openapitools.codegen.utils.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * OpenAPI Generator for Angular 21 with modern best practices:
 * <ul>
 *   <li>Signal-based httpResource for GET requests</li>
 *   <li>Injectable services with inject() function for mutations</li>
 *   <li>Standalone services (providedIn: 'root')</li>
 *   <li>Strict TypeScript with readonly modifiers</li>
 * </ul>
 */
public class Angular21Generator extends TypeScriptAngularClientCodegen {

    private static final Logger LOGGER = LoggerFactory.getLogger(Angular21Generator.class);

    public static final String GENERATOR_NAME = "angular21";
    public static final String USE_HTTP_RESOURCE = "useHttpResource";
    public static final String USE_INJECT_FUNCTION = "useInjectFunction";
    public static final String SEPARATE_RESOURCES = "separateResources";
    public static final String READONLY_MODELS = "readonlyModels";

    protected boolean useHttpResource = true;
    protected boolean useInjectFunction = true;
    protected boolean separateResources = true;
    protected boolean readonlyModels = true;

    public Angular21Generator() {
        super();

        embeddedTemplateDir = templateDir = GENERATOR_NAME;
        outputFolder = "generated-code" + File.separator + GENERATOR_NAME;

        modelTemplateFiles.clear();
        modelTemplateFiles.put("model.mustache", ".ts");

        apiNameSuffix = "Api";
        apiTemplateFiles.clear();
        apiTemplateFiles.put("api-service.mustache", "-api.ts");

        supportingFiles.clear();

        cliOptions.add(new CliOption(USE_HTTP_RESOURCE,
                "Use httpResource for GET requests (signal-based reactive fetching)")
                .defaultValue("true"));
        cliOptions.add(new CliOption(USE_INJECT_FUNCTION,
                "Use inject() function instead of constructor injection")
                .defaultValue("true"));
        cliOptions.add(new CliOption(SEPARATE_RESOURCES,
                "Generate separate resource files for GET operations")
                .defaultValue("true"));
        cliOptions.add(new CliOption(READONLY_MODELS,
                "Add readonly modifier to model properties")
                .defaultValue("true"));
    }

    @Override
    public String getName() {
        return GENERATOR_NAME;
    }

    @Override
    public String getHelp() {
        return "Generates Angular 21 client code with modern best practices including " +
                "httpResource for GET requests, inject() function, and signal-based reactivity.";
    }

    @Override
    public void processOpts() {
        super.processOpts();

        supportingFiles.clear();

        if (additionalProperties.containsKey(USE_HTTP_RESOURCE)) {
            useHttpResource = Boolean.parseBoolean(additionalProperties.get(USE_HTTP_RESOURCE).toString());
        }
        additionalProperties.put(USE_HTTP_RESOURCE, useHttpResource);

        if (additionalProperties.containsKey(USE_INJECT_FUNCTION)) {
            useInjectFunction = Boolean.parseBoolean(additionalProperties.get(USE_INJECT_FUNCTION).toString());
        }
        additionalProperties.put(USE_INJECT_FUNCTION, useInjectFunction);

        if (additionalProperties.containsKey(SEPARATE_RESOURCES)) {
            separateResources = Boolean.parseBoolean(additionalProperties.get(SEPARATE_RESOURCES).toString());
        }
        additionalProperties.put(SEPARATE_RESOURCES, separateResources);

        if (additionalProperties.containsKey(READONLY_MODELS)) {
            readonlyModels = Boolean.parseBoolean(additionalProperties.get(READONLY_MODELS).toString());
        }
        additionalProperties.put(READONLY_MODELS, readonlyModels);

        if (useHttpResource && separateResources) {
            apiTemplateFiles.put("api-resource.mustache", "-resources.ts");
        }

        LOGGER.info("Angular21 Generator initialized with: useHttpResource={}, useInjectFunction={}, " +
                "separateResources={}, readonlyModels={}",
                useHttpResource, useInjectFunction, separateResources, readonlyModels);
    }

    @Override
    public void processOpenAPI(OpenAPI openAPI) {
        super.processOpenAPI(openAPI);

        if (openapiGeneratorIgnoreList == null) {
            openapiGeneratorIgnoreList = new HashSet<>();
        }

        Map<String, TagUsage> usageByTag = new HashMap<>();
        if (openAPI != null && openAPI.getPaths() != null) {
            openAPI.getPaths().forEach((path, pathItem) -> {
                if (pathItem == null) {
                    return;
                }
                addOperationUsage(pathItem.getGet(), true, usageByTag);
                addOperationUsage(pathItem.getPost(), false, usageByTag);
                addOperationUsage(pathItem.getPut(), false, usageByTag);
                addOperationUsage(pathItem.getDelete(), false, usageByTag);
                addOperationUsage(pathItem.getPatch(), false, usageByTag);
                addOperationUsage(pathItem.getHead(), false, usageByTag);
                addOperationUsage(pathItem.getOptions(), false, usageByTag);
                addOperationUsage(pathItem.getTrace(), false, usageByTag);
            });
        }

        for (Map.Entry<String, TagUsage> entry : usageByTag.entrySet()) {
            String apiFilename = toApiFilename(entry.getKey());
            TagUsage usage = entry.getValue();
            if (useHttpResource && separateResources && !usage.hasGet) {
                openapiGeneratorIgnoreList.add("api/" + apiFilename + "-resources.ts");
            }
        }
    }

    @Override
    public String toModelFilename(String name) {
        return toKebabCase(name);
    }

    @Override
    public String toApiFilename(String name) {
        return toKebabCase(name);
    }

    @Override
    public String toApiName(String name) {
        return StringUtils.camelize(name) + "Api";
    }

    @Override
    public String toOperationId(String operationId) {
        String name = super.toOperationId(operationId);
        String normalized = name.replaceFirst("^_+", "");
        normalized = normalized.replaceFirst("\\d+$", "");
        if (normalized.isBlank()) {
            normalized = "operation";
        }
        return normalized;
    }

    private void addOperationUsage(Operation operation, boolean isGet, Map<String, TagUsage> usageByTag) {
        if (operation == null) {
            return;
        }

        List<String> tags = operation.getTags();
        if (tags == null || tags.isEmpty()) {
            tags = Collections.singletonList("default");
        }
        for (String tag : tags) {
            String sanitizedTag = sanitizeTag(tag);
            TagUsage usage = usageByTag.computeIfAbsent(sanitizedTag, key -> new TagUsage());
            if (isGet) {
                usage.hasGet = true;
            } else {
                usage.hasMutation = true;
            }
        }
    }

    private static final class TagUsage {
        private boolean hasGet;
        private boolean hasMutation;
    }

    @Override
    public Map<String, ModelsMap> postProcessAllModels(Map<String, ModelsMap> objs) {
        Map<String, ModelsMap> result = super.postProcessAllModels(objs);

        for (ModelsMap modelsMap : result.values()) {
            for (ModelMap modelMap : modelsMap.getModels()) {
                CodegenModel model = modelMap.getModel();

                boolean isInputDto = model.name.endsWith("Create") ||
                        model.name.endsWith("Update") ||
                        model.name.endsWith("Request") ||
                        model.name.endsWith("Input");

                model.vendorExtensions.put("x-is-input-dto", isInputDto);
                model.vendorExtensions.put("x-use-readonly", readonlyModels && !isInputDto);

                for (CodegenProperty property : model.vars) {
                    property.vendorExtensions.put("x-is-readonly", readonlyModels && !isInputDto);
                }
            }
        }

        return result;
    }

    @Override
    public OperationsMap postProcessOperationsWithModels(OperationsMap objs, List<ModelMap> allModels) {
        // Save original OpenAPI paths before super transforms them with encodeParam
        OperationMap operationsBefore = objs.getOperations();
        Map<String, String> originalPaths = new HashMap<>();
        for (CodegenOperation op : operationsBefore.getOperation()) {
            originalPaths.put(op.operationId, op.path);
        }

        OperationsMap result = super.postProcessOperationsWithModels(objs, allModels);

        OperationMap operations = result.getOperations();
        List<CodegenOperation> ops = operations.getOperation();

        List<CodegenOperation> getOperations = new ArrayList<>();
        List<CodegenOperation> mutationOperations = new ArrayList<>();

        for (CodegenOperation op : ops) {
            op.vendorExtensions.put("x-use-inject", useInjectFunction);

            if ("GET".equalsIgnoreCase(op.httpMethod)) {
                op.vendorExtensions.put("x-is-get", true);
                op.vendorExtensions.put("x-use-http-resource", useHttpResource);
                getOperations.add(op);
            } else {
                op.vendorExtensions.put("x-is-get", false);
                op.vendorExtensions.put("x-is-mutation", true);
                mutationOperations.add(op);
            }

            processPathParameters(op);
            processQueryParameters(op);

            // Build URL path templates from the original OpenAPI path (before super transforms it)
            String originalPath = originalPaths.getOrDefault(op.operationId, op.path);
            String pathTemplate = buildPathTemplate(op, originalPath, false);
            String resourcePathTemplate = buildPathTemplate(op, originalPath, true);
            op.vendorExtensions.put("xPathTemplate", pathTemplate);
            op.vendorExtensions.put("xResourcePathTemplate", resourcePathTemplate);
            if (pathTemplate != null && !pathTemplate.isBlank()) {
                op.path = pathTemplate;
            }
        }

        operations.put("getOperations", getOperations);
        operations.put("mutationOperations", mutationOperations);
        operations.put("hasGetOperations", !getOperations.isEmpty());
        operations.put("hasMutationOperations", !mutationOperations.isEmpty());

        // Build tsImports: map each imported model class to its kebab-case filename
        Set<String> modelImports = new LinkedHashSet<>();
        for (CodegenOperation op : ops) {
            modelImports.addAll(op.imports);
        }
        List<Map<String, String>> tsImports = new ArrayList<>();
        for (String im : modelImports) {
            Map<String, String> tsImport = new HashMap<>();
            tsImport.put("classname", im);
            tsImport.put("filename", toModelFilename(im));
            tsImports.add(tsImport);
        }
        result.put("tsImports", tsImports);

        return result;
    }

    private void processPathParameters(CodegenOperation op) {
        if (op.pathParams != null) {
            for (CodegenParameter param : op.pathParams) {
                param.vendorExtensions.put("x-ts-name", toCamelCase(param.paramName));
                param.vendorExtensions.put("x-is-numeric", isNumericParam(param));
            }
        }
    }

    private void processQueryParameters(CodegenOperation op) {
        if (op.queryParams != null && !op.queryParams.isEmpty()) {
            op.vendorExtensions.put("x-has-query-params", true);

            String paramsInterfaceName = toPascalCase(op.operationId) + "Params";
            op.vendorExtensions.put("x-params-interface-name", paramsInterfaceName);

            for (CodegenParameter param : op.queryParams) {
                param.vendorExtensions.put("x-ts-name", toCamelCase(param.paramName));
            }
        } else {
            op.vendorExtensions.put("x-has-query-params", false);
        }
    }

    /**
     * Build a URL path template from the original OpenAPI path.
     * Replaces {paramName} placeholders with TypeScript template literal variables.
     */
    private String buildPathTemplate(CodegenOperation op, String originalPath, boolean useSignalValue) {
        if (originalPath == null) {
            return null;
        }

        String path = originalPath;

        if (op.pathParams != null) {
            for (CodegenParameter param : op.pathParams) {
                Object tsName = param.vendorExtensions.get("x-ts-name");
                String baseName = tsName != null ? tsName.toString() : param.paramName;
                boolean isNumeric = Boolean.TRUE.equals(param.vendorExtensions.get("x-is-numeric"));

                String valueVar;
                if (useSignalValue) {
                    valueVar = isNumeric ? baseName + "Value" : baseName + "Path";
                } else {
                    valueVar = isNumeric ? baseName : baseName + "Path";
                }

                // Replace {paramBaseName} with ${valueVar}
                String placeholder = "{" + param.baseName + "}";
                path = path.replace(placeholder, "${" + valueVar + "}");
            }
        }

        return path;
    }

    private boolean isNumericParam(CodegenParameter param) {
        if (Boolean.TRUE.equals(param.isInteger) || Boolean.TRUE.equals(param.isNumber)) {
            return true;
        }
        return "number".equals(param.dataType) || "number".equals(param.baseType) || "integer".equals(param.baseType);
    }

    private String toKebabCase(String name) {
        return name.replaceAll("([a-z])([A-Z])", "$1-$2")
                .replaceAll("([A-Z]+)([A-Z][a-z])", "$1-$2")
                .toLowerCase();
    }

    private String toCamelCase(String name) {
        if (name == null || name.isEmpty()) {
            return name;
        }
        Pattern pattern = Pattern.compile("[-_]([a-zA-Z0-9])");
        Matcher matcher = pattern.matcher(name);
        StringBuilder buffer = new StringBuilder();
        while (matcher.find()) {
            matcher.appendReplacement(buffer, matcher.group(1).toUpperCase());
        }
        matcher.appendTail(buffer);
        String result = buffer.toString();
        return Character.toLowerCase(result.charAt(0)) + result.substring(1);
    }

    private String toPascalCase(String name) {
        String camel = toCamelCase(name);
        if (camel == null || camel.isEmpty()) {
            return camel;
        }
        return Character.toUpperCase(camel.charAt(0)) + camel.substring(1);
    }

    @Override
    public CodegenType getTag() {
        return CodegenType.CLIENT;
    }

    @Override
    public String apiFileFolder() {
        return outputFolder + File.separator + "api";
    }

    @Override
    public String modelFileFolder() {
        return outputFolder + File.separator + "model";
    }
}
