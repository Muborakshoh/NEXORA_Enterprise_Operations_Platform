<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;

use App\Models\AIAssistant;
use App\Models\AIConversation;
use App\Models\AIMessage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AIAssistantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = AIAssistant::where('organization_id', $user->organization_id ?? $user->id);

        if ($request->filled('search')) {
            $query->where('name', 'ilike', '%' . $request->get('search') . '%');
        }
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }
        if ($request->has('model')) {
            $query->whereIn('model', (array) $request->get('model'));
        }

        $perPage = min(max((int) $request->get('per_page', 20), 1), 100);
        $items = $query->orderBy('updated_at', 'desc')->paginate($perPage);

        return response()->json([
            'assistants' => $items->items(),
            'total' => $items->total(),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $item = AIAssistant::findOrFail($id);
        return response()->json($item);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'model' => 'required|string',
            'capabilities' => 'nullable|array',
            'config' => 'nullable|array',
            'api_key' => 'nullable|string',
            'provider' => 'nullable|string|in:groq,gemini,custom',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['organization_id'] = Auth::user()->organization_id ?? Auth::id();
        $validated['created_by'] = Auth::id();

        $item = AIAssistant::create($validated);
        return response()->json($item, 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $item = AIAssistant::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'capabilities' => 'nullable|array',
            'config' => 'nullable|array',
            'api_key' => 'nullable|string',
            'provider' => 'nullable|string|in:groq,gemini,custom',
            'is_active' => 'nullable|boolean',
        ]);

        $item->update($validated);
        return response()->json($item);
    }

    public function destroy(string $id): JsonResponse
    {
        $item = AIAssistant::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Assistant deleted']);
    }

    public function sendMessage(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'conversation_id' => 'nullable|string',
        ]);

        $assistant = AIAssistant::findOrFail($id);

        $conversation = null;
        if (!empty($validated['conversation_id'])) {
            $conversation = AIConversation::find($validated['conversation_id']);
        }

        if (!$conversation) {
            $conversation = AIConversation::create([
                'assistant_id' => $assistant->id,
                'user_id' => Auth::id(),
                'title' => substr($validated['message'], 0, 50),
            ]);
        }

        // Save user message
        AIMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $validated['message'],
            'created_at' => now(),
        ]);

        // Call external API if api_key is set
        $assistantResponse = null;
        if (!empty($assistant->api_key)) {
            try {
                $assistantResponse = $this->callExternalApi($assistant, $conversation, $validated['message']);
            } catch (\Exception $e) {
                Log::warning('AI API failed: ' . $e->getMessage());
                $assistantResponse = 'AI API error: ' . $e->getMessage();
            }
        }

        // Fallback if no API key or API failed
        if (!$assistantResponse) {
            $assistantResponse = 'This is a response from ' . $assistant->name . '. (No API key configured — add one in assistant settings to enable real AI responses.)';
        }

        $responseMessage = AIMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $assistantResponse,
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => $responseMessage,
            'conversation_id' => $conversation->id,
        ]);
    }

    public function conversations(Request $request): JsonResponse
    {
        $user = Auth::user();
        $items = AIConversation::where('user_id', $user->id)
            ->with('assistant')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'conversations' => $items,
        ]);
    }

    public function showConversation(string $id): JsonResponse
    {
        $conversation = AIConversation::with('messages')->findOrFail($id);
        return response()->json($conversation);
    }

    // ─── External API Methods ───────────────────────────────────────────────────

    private function callExternalApi(AIAssistant $assistant, AIConversation $conversation, string $message): ?string
    {
        $apiKey = $assistant->api_key;
        if (empty($apiKey)) {
            return null;
        }

        $provider = $assistant->provider ?? 'gemini';
        $temperature = $assistant->config['temperature'] ?? 0.7;
        $maxTokens = $assistant->config['max_tokens'] ?? 2048;

        // Build conversation history
        $history = AIMessage::where('conversation_id', $conversation->id)
            ->orderBy('created_at', 'asc')
            ->limit(20)
            ->get();

        if ($provider === 'groq') {
            return $this->callGroqApi($apiKey, $assistant->model, $history, $message, $temperature, $maxTokens);
        }

        // Default: Gemini
        return $this->callGeminiApi($apiKey, $assistant->model, $history, $message, $temperature, $maxTokens);
    }

    private function callGroqApi(string $apiKey, string $model, $history, string $message, float $temperature, int $maxTokens): string
    {
        $messages = [];
        foreach ($history as $msg) {
            $messages[] = [
                'role' => $msg->role === 'assistant' ? 'assistant' : 'user',
                'content' => $msg->content,
            ];
        }

        // Add current message if not the last one
        $lastMsg = $history->last();
        if (!$lastMsg || $lastMsg->content !== $message) {
            $messages[] = ['role' => 'user', 'content' => $message];
        }

        $payload = [
            'model' => $model,
            'messages' => $messages,
            'temperature' => $temperature,
            'max_tokens' => $maxTokens,
        ];

        $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception('Groq cURL error: ' . $error);
        }

        if ($httpCode !== 200) {
            throw new \Exception('Groq API returned HTTP ' . $httpCode . ': ' . $response);
        }

        $data = json_decode($response, true);
        return $data['choices'][0]['message']['content'] ?? throw new \Exception('No response from Groq API');
    }

    private function callGeminiApi(string $apiKey, string $model, $history, string $message, float $temperature, int $maxTokens): string
    {
        $contents = [];
        foreach ($history as $msg) {
            $contents[] = [
                'role' => $msg->role === 'user' ? 'user' : 'model',
                'parts' => [['text' => $msg->content]],
            ];
        }

        $lastMsg = $history->last();
        if (!$lastMsg || $lastMsg->content !== $message || $lastMsg->role !== 'user') {
            $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => $temperature,
                'maxOutputTokens' => $maxTokens,
            ],
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \Exception('Gemini cURL error: ' . $error);
        }

        if ($httpCode !== 200) {
            throw new \Exception('Gemini API returned HTTP ' . $httpCode . ': ' . $response);
        }

        $data = json_decode($response, true);
        return $data['candidates'][0]['content']['parts'][0]['text'] ?? throw new \Exception('No response from Gemini API');
    }
}
