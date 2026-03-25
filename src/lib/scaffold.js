import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * Generates a ZIP file from a conceptual project structure.
 * @param {Array} scaffold - Array of { path, content } objects.
 * @param {string} projectName - Name of the project for the ZIP filename.
 */
export async function downloadScaffold(scaffold, projectName = "systemforge-project") {
    if (!scaffold || !Array.isArray(scaffold)) {
        console.error("No scaffold data provided");
        return;
    }

    const zip = new JSZip();

    scaffold.forEach(file => {
        // Handle folders automatically by using full path in zip.file
        zip.file(file.path, file.content);
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${projectName.toLowerCase().replace(/\s+/g, "-")}-boilerplate.zip`);
}
