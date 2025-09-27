package de.tum.cit.aet.utility;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Thin HTTP client for MVC.
 * - Central place for common request setup (Accept, JSON content).
 * - Keeps request-building logic away from individual tests.
 *
 * Tip: Use the "with(...)" helper to attach security to all requests from this client,
 * for example a JWT RequestPostProcessor.
 */
@Component
public class MvcTestClient {

    // --- Framework wiring -----------------------------------------------------------
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;

    // --- Defaults -------------------------------------------------------------------
    private MediaType defaultAccept = MediaType.APPLICATION_JSON;

    /**
     * RequestPostProcessors applied to every request from this client.
     * Typical use is authentication, e.g. a JWT post-processor.
     */
    private final List<RequestPostProcessor> defaultPostProcessors = new ArrayList<>();

    public MvcTestClient withDefaultAccept(MediaType accept) {
        this.defaultAccept = accept;
        return this;
    }

    public MvcTestClient with(RequestPostProcessor... rpps) {
        this.defaultPostProcessors.clear();
        if (rpps != null && rpps.length > 0) {
            this.defaultPostProcessors.addAll(Arrays.asList(rpps));
        }
        return this;
    }

    public MvcTestClient withoutPostProcessors() {
        this.defaultPostProcessors.clear();
        return this;
    }


    public <T> T getAndReadOk(String url, Map<String, String> params, Class<T> type, MediaType... accepts) {
        if (type == Void.class) {
            getOk(url, params, accepts);
            return null;
        }
        return read(getOk(url, params, accepts), type);
    }

    public <T> T getAndReadOk(String url, Map<String, String> params, TypeReference<T> typeRef, MediaType... accepts) {
        return read(getOk(url, params, accepts), typeRef);
    }

    public <T> T postAndReadOk(String url, Object body, Class<T> type, MediaType... accepts) {
        if (type == Void.class) {
            postOk(url, body, accepts);
            return null;
        }
        return read(postOk(url, body, accepts), type);
    }

    public <T> T postAndReadOk(String url, Object body, TypeReference<T> typeRef, MediaType... accepts) {
        return read(postOk(url, body, accepts), typeRef);
    }

    public <T> T putAndReadOk(String url, Object body, Class<T> type, MediaType... accepts) {
        if (type == Void.class) {
            putOk(url, body, accepts);
            return null;
        }
        return read(putOk(url, body, accepts), type);
    }

    public <T> T putAndReadOk(String url, Object body, TypeReference<T> typeRef, MediaType... accepts) {
        return read(putOk(url, body, accepts), typeRef);
    }

    public <T> T deleteAndReadOk(String url, Object body, Class<T> type, MediaType... accepts) {
        if (type == Void.class) {
            deleteNoContent(url, body, accepts);
            return null;
        }
        return read(deleteNoContent(url, body, accepts), type);
    }

    public <T> T deleteAndReadOk(String url, Object body, TypeReference<T> typeRef, MediaType... accepts) {
        return read(deleteNoContent(url, body, accepts), typeRef);
    }

    // --- Extra helpers: 204 No Content & 401 Unauthorized ---------------------------

    public void getNoContent(String url, Map<String, String> params, MediaType... accepts) {
        getNoContentResult(url, params, accepts);
    }

    public void postNoContent(String url, Object body, MediaType... accepts) {
        postNoContentResult(url, body, accepts);
    }

    public void putNoContent(String url, Object body, MediaType... accepts) {
        putNoContentResult(url, body, accepts);
    }

    public void getUnauthorized(String url, Map<String, String> params, MediaType... accepts) {
        getUnauthorizedResult(url, params, accepts);
    }

    public void postUnauthorized(String url, Object body, MediaType... accepts) {
        postUnauthorizedResult(url, body, accepts);
    }

    public void putUnauthorized(String url, Object body, MediaType... accepts) {
        putUnauthorizedResult(url, body, accepts);
    }

    public void deleteUnauthorized(String url, Object body, MediaType... accepts) {
        deleteUnauthorizedResult(url, body, accepts);
    }

    // --- Low-level asserts (wrap checked exceptions) --------------------------------

    private MvcResult getOk(String url, Map<String, String> params, MediaType... accepts) {
        try {
            return get(url, params, accepts).andExpect(status().isOk()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("GET " + url + " failed", e);
        }
    }

    private MvcResult postOk(String url, Object body, MediaType... accepts) {
        try {
            return postJson(url, body, accepts).andExpect(status().isOk()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("POST " + url + " failed", e);
        }
    }

    private MvcResult putOk(String url, Object body, MediaType... accepts) {
        try {
            return putJson(url, body, accepts).andExpect(status().isOk()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("PUT " + url + " failed", e);
        }
    }

    private MvcResult deleteNoContent(String url, Object body, MediaType... accepts) {
        try {
            return deleteJson(url, body, accepts).andExpect(status().isNoContent()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("DELETE " + url + " failed (expected 204)", e);
        }
    }

    private MvcResult getNoContentResult(String url, Map<String, String> params, MediaType... accepts) {
        try {
            return get(url, params, accepts).andExpect(status().isNoContent()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("GET " + url + " failed (expected 204)", e);
        }
    }

    private MvcResult postNoContentResult(String url, Object body, MediaType... accepts) {
        try {
            return postJson(url, body, accepts).andExpect(status().isNoContent()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("POST " + url + " failed (expected 204)", e);
        }
    }

    private MvcResult putNoContentResult(String url, Object body, MediaType... accepts) {
        try {
            return putJson(url, body, accepts).andExpect(status().isNoContent()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("PUT " + url + " failed (expected 204)", e);
        }
    }

    private MvcResult getUnauthorizedResult(String url, Map<String, String> params, MediaType... accepts) {
        try {
            return get(url, params, accepts).andExpect(status().isUnauthorized()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("GET " + url + " failed (expected 401)", e);
        }
    }

    private MvcResult postUnauthorizedResult(String url, Object body, MediaType... accepts) {
        try {
            return postJson(url, body, accepts).andExpect(status().isUnauthorized()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("POST " + url + " failed (expected 401)", e);
        }
    }

    private MvcResult putUnauthorizedResult(String url, Object body, MediaType... accepts) {
        try {
            return putJson(url, body, accepts).andExpect(status().isUnauthorized()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("PUT " + url + " failed (expected 401)", e);
        }
    }

    private MvcResult deleteUnauthorizedResult(String url, Object body, MediaType... accepts) {
        try {
            return deleteJson(url, body, accepts).andExpect(status().isUnauthorized()).andReturn();
        } catch (Exception e) {
            throw new AssertionError("DELETE " + url + " failed (expected 401)", e);
        }
    }

    // --- HTTP performers (low-level) ------------------------------------------------

    private ResultActions get(String url, MediaType... accepts) throws Exception {
        return mockMvc.perform(
            applyDefaults(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url), accepts)
        );
    }

    private ResultActions get(String url, Map<String, String> params, MediaType... accepts) throws Exception {
        MockHttpServletRequestBuilder requestBuilder =
            applyDefaults(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url), accepts);
        if (params != null) params.forEach(requestBuilder::param);
        return mockMvc.perform(requestBuilder);
    }

    private ResultActions postJson(String url, Object body, MediaType... accepts) throws Exception {
        return mockMvc.perform(
            applyDefaults(post(url), accepts)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
        );
    }

    private ResultActions putJson(String url, Object body, MediaType... accepts) throws Exception {
        return mockMvc.perform(
            applyDefaults(put(url), accepts)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
        );
    }

    private ResultActions deleteJson(String url, Object body, MediaType... accepts) throws Exception {
        MockHttpServletRequestBuilder requestBuilder = applyDefaults(delete(url), accepts)
            .contentType(MediaType.APPLICATION_JSON);
        if (body != null) requestBuilder.content(objectMapper.writeValueAsString(body));
        return mockMvc.perform(requestBuilder);
    }

    // --- Shortcuts that parse JSON bodies -------------------------------------------

    private <T> T read(MvcResult result, Class<T> type) {
        try {
            return objectMapper.readValue(body(result), type);
        } catch (Exception e) {
            throw new AssertionError("Failed to read body as " + type.getSimpleName(), e);
        }
    }

    private <T> T read(MvcResult result, TypeReference<T> typeRef) {
        try {
            return objectMapper.readValue(body(result), typeRef);
        } catch (Exception e) {
            throw new AssertionError("Failed to read body via TypeReference", e);
        }
    }

    // --- Internal helpers -----------------------------------------------------------

    private MockHttpServletRequestBuilder applyDefaults(MockHttpServletRequestBuilder requestBuilder, MediaType... accepts) {
        requestBuilder = (accepts != null && accepts.length > 0)
            ? requestBuilder.accept(accepts)
            : requestBuilder.accept(defaultAccept);
        for (RequestPostProcessor rpp : defaultPostProcessors) {
            requestBuilder.with(rpp);
        }
        return requestBuilder;
    }

    private static String body(MvcResult result) throws Exception {
        MockHttpServletResponse resp = result.getResponse();
        return resp.getContentAsString();
    }
}
