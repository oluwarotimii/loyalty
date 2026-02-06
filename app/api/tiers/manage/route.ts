import { NextRequest } from 'next/server';
import { 
  createTier, 
  updateTier, 
  deleteTier, 
  createTierBenefit, 
  updateTierBenefit, 
  deleteTierBenefit 
} from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.type === 'tier') {
      // Map min_points to min_spend for backward compatibility
      const tierData = {
        ...body.data,
        min_spend: body.data.min_points !== undefined ? body.data.min_points : body.data.min_spend
      };
      // Remove min_points if it exists to avoid conflicts
      if ('min_points' in tierData) delete tierData.min_points;
      
      const tier = await createTier(tierData);
      return Response.json(tier);
    } else if (body.type === 'benefit') {
      const benefit = await createTierBenefit(body.data);
      return Response.json(benefit);
    } else {
      return Response.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Create tier/benefit error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    
    if (!id || !type) {
      return Response.json({ error: 'Missing ID or type' }, { status: 400 });
    }
    
    const body = await request.json();
    
    if (type === 'tier') {
      // Map min_points to min_spend for backward compatibility
      const tierData = { ...body };
      if (tierData.min_points !== undefined) {
        tierData.min_spend = tierData.min_points;
        delete tierData.min_points;
      }
      
      const tier = await updateTier(id, tierData);
      return Response.json(tier);
    } else if (type === 'benefit') {
      const benefit = await updateTierBenefit(id, body);
      return Response.json(benefit);
    } else {
      return Response.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Update tier/benefit error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    
    if (!id || !type) {
      return Response.json({ error: 'Missing ID or type' }, { status: 400 });
    }
    
    if (type === 'tier') {
      await deleteTier(id);
      return Response.json({ success: true });
    } else if (type === 'benefit') {
      await deleteTierBenefit(id);
      return Response.json({ success: true });
    } else {
      return Response.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Delete tier/benefit error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}