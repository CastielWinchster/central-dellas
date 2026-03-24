import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileUrl } = await req.json();

    if (!fileUrl) {
      return Response.json({ error: 'fileUrl is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    
    if (!apiKey) {
      console.error('GOOGLE_VISION_API_KEY not configured');
      return Response.json({ error: 'Vision API not configured' }, { status: 500 });
    }

    // Buscar imagem
    const imageResponse = await fetch(fileUrl);
    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Chamar Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
          }]
        })
      }
    );

    const data = await visionResponse.json();

    if (data.responses?.[0]?.textAnnotations) {
      return Response.json({ 
        success: true,
        text: data.responses[0].textAnnotations[0].description 
      });
    }

    return Response.json({ 
      success: true,
      text: null 
    });
  } catch (error) {
    console.error('Error analyzing document:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});