from typing import Optional, List
from openai import OpenAI
from app.core.config import settings
from app.models.brand import Brand
from app.models.product import Product

client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None


def _build_brand_context(brand: Brand, product: Product) -> str:
    features = ", ".join(product.features or [])
    benefits = ", ".join(product.benefits or [])
    return f"""
Brand: {brand.name}
Industry: {brand.industry or 'Not specified'}
Brand Tone: {brand.brand_tone or 'professional'}
Target Audience: {brand.target_audience or 'general audience'}
Brand Values: {brand.brand_values or ''}

Product: {product.name}
Description: {product.description or ''}
Price: {f'${product.price}' if product.price else 'Not specified'}
Category: {product.category or ''}
Key Features: {features}
Benefits: {benefits}
Call to Action: {product.call_to_action or 'Learn more'}
""".strip()


PLATFORM_CONSTRAINTS = {
    "instagram": "Instagram caption (max 2200 chars, conversational, emoji-friendly, include 5-10 relevant hashtags at end)",
    "youtube": "YouTube video description (engaging, SEO-optimized, include timestamps if applicable, 500-1000 words)",
    "linkedin": "LinkedIn post (professional tone, thought leadership style, max 3000 chars, minimal hashtags)",
    "general": "marketing copy",
}

CONTENT_TYPE_PROMPTS = {
    "caption": """Write a compelling social media caption for this product.
Platform: {platform_desc}
Requirements:
- Hook the reader in the first line
- Highlight the key benefit
- End with a clear call to action
- Match the brand tone exactly
""",
    "script": """Write a marketing video script for this product.
Format:
- HOOK (0-5 sec): Attention-grabbing opening line
- PROBLEM (5-15 sec): Pain point the product solves
- SOLUTION (15-30 sec): How the product helps
- FEATURES (30-45 sec): 3 key features/benefits
- CTA (45-60 sec): Strong call to action
Keep it conversational and match brand tone.
""",
    "video_script": """Write a detailed video script for this product (60-90 seconds).
Include:
- [VISUAL] directions for each scene
- Voiceover text
- On-screen text suggestions
- Background music mood suggestion
Format as a proper production script.
""",
    "hashtags": """Generate 20-30 highly relevant hashtags for this product post.
Mix of:
- High volume (1M+ posts): 5 hashtags
- Medium volume (100K-1M): 10 hashtags
- Niche/targeted (under 100K): 10 hashtags
Return ONLY the hashtags, one per line, starting with #
""",
}


def generate_content(
    brand: Brand,
    product: Product,
    content_type: str,
    platform: str = "general",
    tone_override: Optional[str] = None,
    custom_instructions: Optional[str] = None,
    num_variations: int = 1,
) -> dict:
    """Generate marketing content using OpenAI."""

    if not client:
        # Return mock content for development without API key
        return _mock_content(brand, product, content_type, platform)

    brand_context = _build_brand_context(brand, product)
    platform_desc = PLATFORM_CONSTRAINTS.get(platform, PLATFORM_CONSTRAINTS["general"])
    content_prompt = CONTENT_TYPE_PROMPTS.get(content_type, CONTENT_TYPE_PROMPTS["caption"])
    content_prompt = content_prompt.format(platform_desc=platform_desc)

    tone = tone_override or brand.brand_tone or "professional"

    system_prompt = f"""You are an expert marketing copywriter specializing in AI-driven brand content.
Your writing is {tone}, engaging, and conversion-focused.
Always tailor content to the specific brand voice and target audience provided.
Return only the requested content with no meta-commentary or explanations."""

    user_prompt = f"""Brand & Product Context:
{brand_context}

Task: {content_prompt}

{f'Additional Instructions: {custom_instructions}' if custom_instructions else ''}

Write {num_variations} variation{'s' if num_variations > 1 else ''}.
{f'Separate each variation with "---VARIATION---" on its own line.' if num_variations > 1 else ''}"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.8,
        max_tokens=2000,
    )

    raw_text = response.choices[0].message.content.strip()
    tokens_used = response.usage.total_tokens

    # Parse variations
    if num_variations > 1 and "---VARIATION---" in raw_text:
        parts = [v.strip() for v in raw_text.split("---VARIATION---") if v.strip()]
        main_content = parts[0]
        variations = parts[1:] if len(parts) > 1 else []
    else:
        main_content = raw_text
        variations = []

    return {
        "content": main_content,
        "variations": variations,
        "model_used": "gpt-4o-mini",
        "tokens_used": tokens_used,
        "prompt_used": user_prompt[:500],  # Store truncated prompt
    }


def _mock_content(brand: Brand, product: Product, content_type: str, platform: str) -> dict:
    """Return mock content when no API key is configured."""
    mocks = {
        "caption": f"✨ Introducing {product.name} by {brand.name}!\n\n{product.description or 'A revolutionary product that changes everything.'}\n\n🎯 Perfect for {brand.target_audience or 'everyone who wants the best'}.\n\n👉 {product.call_to_action or 'Shop now - link in bio!'}\n\n#{''.join(brand.name.split())} #{product.category or 'product'} #innovation",
        "script": f"""HOOK: "Are you tired of settling for less? Meet {product.name}."

PROBLEM: Every day, people struggle without the right solution. That ends today.

SOLUTION: {brand.name} presents {product.name} — {product.description or 'the product that changes everything'}.

FEATURES:
• {(product.features or ['Feature 1', 'Feature 2', 'Feature 3'])[0]}
• {(product.features or ['Feature 1', 'Feature 2', 'Feature 3'])[min(1, len(product.features or [])-1)] if product.features else 'Feature 2'}
• Premium quality, guaranteed satisfaction.

CTA: "{product.call_to_action or 'Visit us today and transform your experience. Link in bio!'}"
""",
        "hashtags": f"#{brand.name.replace(' ', '')}\n#{product.name.replace(' ', '')}\n#{product.category or 'Product'}\n#Innovation\n#NewProduct\n#MustHave\n#BrandLife\n#QualityFirst",
        "video_script": f"""[VISUAL: Product hero shot with dramatic lighting]
VOICEOVER: "Introducing {product.name} from {brand.name}."

[VISUAL: Problem scenario - person frustrated]
VOICEOVER: "You deserve better. You deserve {product.name}."

[VISUAL: Product features close-up]
VOICEOVER: "{product.description or 'Crafted for excellence, built for you.'}"

[VISUAL: Happy customer using product]
ON-SCREEN TEXT: "{product.call_to_action or 'Get Yours Today'}"

[VISUAL: Brand logo + website]
VOICEOVER: "Visit {brand.website_url or brand.name + '.com'} to learn more."
""",
    }
    return {
        "content": mocks.get(content_type, mocks["caption"]),
        "variations": [],
        "model_used": "mock",
        "tokens_used": 0,
        "prompt_used": "mock",
    }
