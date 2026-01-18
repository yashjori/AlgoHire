package com.algohire.backend.anticheat;

import java.util.List;

public record AntiCheatResult(
        boolean suspicious,
        List<String> reasons
) {}
