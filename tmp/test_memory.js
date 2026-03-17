async function testMemory() {
    console.log("Testing /api/langchain/memory (Conversation Memory)...");
    
    try {
        // --- MESSAGE 1: The Intro ---
        console.log("\n--- Message 1: Sending intro...");
        const res1 = await fetch('http://localhost:3000/api/langchain/memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: "Hi! My name is Rizan and I am building SystemForge.",
                history: [] 
            })
        });
        const data1 = await res1.json();
        if (data1.error) throw new Error("API Error 1: " + data1.error);
        console.log("AI Response 1:", data1.text);

        // --- MESSAGE 2: The Memory Test ---
        console.log("\n--- Message 2: Testing memory...");
        const res2 = await fetch('http://localhost:3000/api/langchain/memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: "What is my name and what am I building?",
                history: [
                    { role: "user", text: "Hi! My name is Rizan and I am building SystemForge." },
                    { role: "assistant", text: data1.text }
                ] 
            })
        });
        const data2 = await res2.json();
        if (data2.error) throw new Error("API Error 2: " + data2.error);
        console.log("AI Response 2:", data2.text);

        if (data2.text && data2.text.includes("Rizan") && data2.text.includes("SystemForge")) {
            console.log("\n✅ SUCCESS: Memory confirmed! AI remembers Rizan and SystemForge.");
        } else {
            console.log("\n❌ FAILURE: AI context check failed. Response:", data2.text);
        }

    } catch (error) {
        console.error("Test Failed:", error.message);
    }
}

testMemory();
