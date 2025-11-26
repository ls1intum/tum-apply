package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.usermanagement.domain.Department;
import de.tum.cit.aet.usermanagement.domain.School;
import de.tum.cit.aet.usermanagement.repository.DepartmentRepository;

/**
 * Test data helpers for Department.
 * Keeps entity construction and saving in one place.
 */
public final class DepartmentTestData {

    private DepartmentTestData() {}

    /**
     * Unsaved Department with sane defaults.
     */
    public static Department newDepartment(School school) {
        Department department = new Department();
        department.setName("Computer Science");
        department.setSchool(school);
        return department;
    }

    /**
     * Unsaved Department; all fields optional (null = keep default).
     */
    public static Department newDepartmentAll(String name, School school) {
        Department department = new Department();
        department.setName(name != null ? name : "Computer Science");
        department.setSchool(school);
        return department;
    }

    // --- Save to Repository variants -------------------------------------------------------------------------

    /**
     * Saved Department with default name.
     */
    public static Department saved(DepartmentRepository repo, School school) {
        return repo.save(newDepartment(school));
    }

    /**
     * Saved Department with custom name.
     */
    public static Department saved(DepartmentRepository repo, String name, School school) {
        return repo.save(newDepartmentAll(name, school));
    }

    /**
     * Saved Department with defaults.
     */
    public static Department savedDefault(DepartmentRepository repo, School school) {
        return saved(repo, school);
    }
}
