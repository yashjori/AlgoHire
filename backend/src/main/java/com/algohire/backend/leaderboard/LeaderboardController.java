package com.algohire.backend.leaderboard;

import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/leaderboard")
public class LeaderboardController {

    private final LeaderboardService service;

    public LeaderboardController(LeaderboardService service) {
        this.service = service;
    }

    @GetMapping("/{problemId}")
    public List<Map<String, Object>> leaderboard(
            @PathVariable String problemId
    ) {

        List<Map<String, Object>> response = new ArrayList<>();

        Set<ZSetOperations.TypedTuple<String>> top =
                service.topN(problemId, 10);

        int rank = 1;
        for (var entry : top) {
            Map<String, Object> row = new HashMap<>();
            row.put("rank", rank++);
            row.put("email", entry.getValue());
            row.put("executionTimeMs", entry.getScore());
            response.add(row);
        }
        return response;
    }
}
