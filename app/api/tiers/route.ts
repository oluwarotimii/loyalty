import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  try {
    console.log('Fetching tiers from API...');
    
    // First, get all tiers
    const tiersResult = await sql`
      SELECT id, name, min_spend, rank_order, evaluation_period, is_active
      FROM tiers
      ORDER BY min_spend ASC
    `;
    
    console.log('Tiers query result:', tiersResult.rows);
    
    const tiers = tiersResult.rows;
    
    // Then get all benefits grouped by tier
    const benefitsResult = await sql`
      SELECT tier_id, id, title, description
      FROM tier_benefits
      ORDER BY tier_id, title
    `;
    
    console.log('Benefits query result:', benefitsResult.rows);
    
    // Group benefits by tier_id
    const benefitsByTier = benefitsResult.rows.reduce((acc, benefit) => {
      if (!acc[benefit.tier_id]) {
        acc[benefit.tier_id] = [];
      }
      acc[benefit.tier_id].push({
        id: benefit.id,
        title: benefit.title,
        description: benefit.description
      });
      return acc;
    }, {});
    
    console.log('Benefits grouped by tier:', benefitsByTier);
    
    // Combine tiers with their benefits
    const tiersWithBenefits = tiers.map(tier => ({
      ...tier,
      min_amount: tier.min_spend, // Amount-based model
      min_spend: tier.min_spend,  // Also include the actual field
      max_amount: null,           // No max_amount in the schema
      benefits: benefitsByTier[tier.id] || []
    }));
    
    console.log('Final tiers with benefits:', tiersWithBenefits);

    return Response.json(tiersWithBenefits);
  } catch (error) {
    console.error('Get tiers error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
