import { NextResponse } from 'next/server';
import { SEED_APPRAISALS } from '@/lib/initialData';
import { saveAppraisalApi } from '@/lib/api';

export async function GET() {
  try {
    let successCount = 0;
    // Iterate over all 418 records and upload them
    // Note: To avoid overwhelming Supabase with 418 concurrent connections,
    // we process them in batches of 10 or sequentially.
    const batchSize = 10;
    for (let i = 0; i < SEED_APPRAISALS.length; i += batchSize) {
      const batch = SEED_APPRAISALS.slice(i, i + batchSize);
      await Promise.all(batch.map((appraisal) => saveAppraisalApi(appraisal)));
      successCount += batch.length;
    }
    
    return NextResponse.json({ message: 'Seeding completed', count: successCount });
  } catch (error) {
    console.error('Seeding failed:', error);
    return NextResponse.json({ message: 'Seeding failed', error }, { status: 500 });
  }
}
