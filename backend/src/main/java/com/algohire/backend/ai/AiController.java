package com.algohire.backend.ai;

import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final OpenAiChatModel chatModel;

    public AiController(OpenAiChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @PostMapping("/code-hint")
    public String getCodeHint(@RequestBody String code) {
        String prompt = "You are an expert coding interviewer. Give ONLY a short, smart hint (1-2 lines) to improve or fix this code:\n\n" + code;
        return chatModel.call(new Prompt(prompt))
                .getResult()
                .getOutput()
                .getText();
    }
}
