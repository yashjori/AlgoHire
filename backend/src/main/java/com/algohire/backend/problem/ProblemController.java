package com.algohire.backend.problem;

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

    // Recruiter only
    @PostMapping
    @PreAuthorize("hasRole('RECRUITER')")
    public Problem create(@RequestBody Problem problem, Authentication auth) {
        problem.setCreatedBy(auth.getName());
        return service.create(problem);
    }

    // Candidate + Recruiter
    @GetMapping
    public List<Problem> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Problem getOne(@PathVariable String id) {
        return service.getById(id);
    }
}
