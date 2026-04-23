
import axios from 'axios';

async function runDiagnostic() {
  const videoId = "f-Yh5L4fT8E"; // Our wood-boiler node
  console.log(`[DIAGNOSTIC] Probing Recursive Extraction Node for: ${videoId}`);

  try {
    const response = await axios.post('http://0.0.0.0:3000/api/recursive-extraction', {
      videoId,
      depth: 0
    });

    console.log(`[DIAGNOSTIC_SUCCESS] Depth: ${response.data.depth} | Status: ${response.data.environmentStatus}`);
    console.log(`[DIAGNOSTIC_DATA] Extracted ${response.data.segments.length} segments.`);
  } catch (error) {
    if (error.response) {
      console.error(`[DIAGNOSTIC_FAILURE] Status: ${error.response.status} | Error: ${error.response.data.error}`);
    } else {
      console.error(`[DIAGNOSTIC_CRASH]`, error.message);
    }
  }
}

runDiagnostic();
