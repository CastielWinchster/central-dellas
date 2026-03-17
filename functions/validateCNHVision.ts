import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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
      return Response.json({ error: 'Google Vision API key not configured' }, { status: 500 });
    }

    // Baixar imagem e converter para base64
    const imageResponse = await fetch(fileUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          }],
        }),
      }
    );

    const visionData = await visionResponse.json();

    if (!visionData.responses || !visionData.responses[0]?.textAnnotations) {
      return Response.json({ valid: false, error: 'ocr_failed', feedback: 'OCR falhou' });
    }

    const fullText = visionData.responses[0].textAnnotations[0].description.toUpperCase();

    const hasCPF = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/.test(fullText);
    const hasBrazilianKeywords = /BRASILEIRA|HABILITAÇÃO|REPÚBLICA|FEDERATIVA/i.test(fullText);

    if (!hasCPF && !hasBrazilianKeywords) {
      return Response.json({ valid: false, error: 'ocr_failed', feedback: 'Documento não reconhecido' });
    }

    const extractedData = {};

    const nameMatch = fullText.match(/(?:NOME|NAME)[:\s]+([A-ZÀ-Ú\s]+?)(?:\n|CPF|RG|DATA)/);
    if (nameMatch) extractedData.name = nameMatch[1].trim();

    const cpfMatch = fullText.match(/(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/);
    if (cpfMatch) extractedData.cpf = cpfMatch[1];

    const cnhMatch = fullText.match(/(?:REGISTRO|CNH|CARTEIRA)[:\s]*(\d{10,11})/);
    if (cnhMatch) extractedData.document_number = cnhMatch[1];

    const birthDateMatch = fullText.match(/(?:DATA DE NASCIMENTO|NASCIMENTO|NASC)[:\s]*(\d{2}\/\d{2}\/\d{4})/);
    if (birthDateMatch) extractedData.birth_date = birthDateMatch[1];

    const expiryMatch = fullText.match(/(?:VALIDADE|VALID)[:\s]*(\d{2}\/\d{2}\/\d{4})/);
    if (expiryMatch) extractedData.expiry_date = expiryMatch[1];

    return Response.json({
      valid: true,
      extracted_data: extractedData,
      confidence: 0.9,
    });

  } catch (error) {
    console.error('[validateCNHVision] Erro:', error);
    return Response.json({ valid: false, error: 'ocr_failed', feedback: error.message }, { status: 500 });
  }
});