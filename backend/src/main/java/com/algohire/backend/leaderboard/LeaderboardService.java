package com.algohire.backend.leaderboard;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class LeaderboardService {

    private final RedisTemplate<String, String> redisTemplate;

    public LeaderboardService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    private String key(String problemId) {
        return "leaderboard:problem:" + problemId;
    }

    // 🔥 called from CodeExecutionService
    public void updateScore(String problemId, String email, long executionTime) {
        redisTemplate.opsForZSet()
                .add(key(problemId), email, executionTime);
    }

    // ✅ RETURN TypedTuple (email + score)
    public Set<ZSetOperations.TypedTuple<String>> topN(String problemId, int n) {
        return redisTemplate.opsForZSet()
                .rangeWithScores(key(problemId), 0, n - 1);
    }
}
