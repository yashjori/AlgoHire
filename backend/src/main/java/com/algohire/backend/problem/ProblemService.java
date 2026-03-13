package com.algohire.backend.problem;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProblemService {

    private final ProblemRepository repository;

    public ProblemService(ProblemRepository repository) {
        this.repository = repository;
    }

    public Problem create(Problem problem) {
        return repository.save(problem);
    }

    public List<Problem> getAll() {
        return repository.findAll();
    }

    public Problem getById(String id) {
        return repository.findById(id).orElse(null);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}
