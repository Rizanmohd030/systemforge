async function testStructuredOutput() {
    console.log("Testing /api/langchain/structured...");
    
    try {
        const response = await fetch('http://localhost:3000/api/langchain/structured', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: "A grocery list app for students" })
        });

        const data = await response.json();
        
        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(data, null, 2));

        if (data.projectName && Array.isArray(data.features)) {
            console.log("\n✅ SUCCESS: Structured output received and matches schema!");
        } else {
            console.log("\n❌ FAILURE: Output does not match expected schema.");
        }
    } catch (error) {
        console.error("Test Error:", error.message);
    }
}

testStructuredOutput();
