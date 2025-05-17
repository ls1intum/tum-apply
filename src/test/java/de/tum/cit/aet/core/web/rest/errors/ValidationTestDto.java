package de.tum.cit.aet.core.web.rest.errors;

import jakarta.validation.constraints.NotBlank;

public class ValidationTestDto {

    @NotBlank(message = "name must not be blank")
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
