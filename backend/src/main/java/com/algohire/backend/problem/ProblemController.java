package com.algohire.backend.problem;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/problems")
public class ProblemController {

    private final ProblemService service;

    public ProblemController(ProblemService service) {
        this.service = service;
    }

    /** Recruiter only: create a new problem */
    @PostMapping
    @PreAuthorize("hasRole('RECRUITER')")
    public Problem create(@RequestBody Problem problem, Authentication auth) {
        problem.setCreatedBy(auth.getName());
        return service.create(problem);
    }

    /** Everyone: list all problems (hidden test cases stripped for candidates) */
    @GetMapping
    public List<Problem> getAll(Authentication auth) {
        List<Problem> problems = service.getAll();
        boolean isCandidate = auth == null || !auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_RECRUITER"));
        if (isCandidate) {
            problems.forEach(p -> p.setTestCases(List.of()));
        }
        return problems;
    }

    /** Everyone: get one problem (hidden test cases stripped for candidates) */
    @GetMapping("/{id}")
    public ResponseEntity<Problem> getOne(@PathVariable String id, Authentication auth) {
        Problem p = service.getById(id);
        if (p == null) return ResponseEntity.notFound().build();

        boolean isCandidate = auth == null || !auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_RECRUITER"));
        if (isCandidate) {
            p.setTestCases(List.of()); // do NOT expose hidden test cases
        }
        return ResponseEntity.ok(p);
    }

    /** Recruiter only: update a problem */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<Problem> update(@PathVariable String id, @RequestBody Problem problem, Authentication auth) {
        Problem existing = service.getById(id);
        if (existing == null) return ResponseEntity.notFound().build();
        if (!existing.getCreatedBy().equals(auth.getName())) return ResponseEntity.status(403).build();
        problem.setId(id);
        problem.setCreatedBy(auth.getName());
        return ResponseEntity.ok(service.create(problem));
    }

    /** Recruiter only: delete a problem */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        Problem existing = service.getById(id);
        if (existing == null) return ResponseEntity.notFound().build();
        if (!existing.getCreatedBy().equals(auth.getName())) return ResponseEntity.status(403).build();
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
