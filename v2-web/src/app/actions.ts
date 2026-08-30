'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateChannelSubmission } from '@/lib/submission-validation';

export async function getChannelProviderCount() {
  try {
    const { count, error } = await Promise.race([
      supabaseAdmin.from('crawler_targets').select('*', { count: 'exact', head: true }).eq('is_active', true),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('channel_count_timeout')), 5_000)),
    ]);
    
    if (error) {
      console.error('Error fetching channel provider count:', error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error('Exception fetching channel provider count:', err);
    return 0;
  }
}


export async function submitChannel(formData: FormData) {
  try {
    const validation = validateChannelSubmission(formData);
    if (validation.ok === false) return { success: false, error: validation.error };
    const { name, siteUrl, contact, remarks, honeypot } = validation.value;
    if (honeypot) return { success: true };

    const [{ data: existingSubmission, error: submissionLookupError }, { data: existingTarget, error: targetLookupError }] = await Promise.all([
      supabaseAdmin.from('user_target_submissions').select('id').eq('site_url', siteUrl).limit(1).maybeSingle(),
      supabaseAdmin.from('crawler_targets').select('id').eq('site_url', siteUrl).limit(1).maybeSingle(),
    ]);
    if (submissionLookupError || targetLookupError) {
      console.error('Error checking channel submission duplicates:', submissionLookupError || targetLookupError);
      return { success: false, error: '暂时无法校验渠道，请稍后重试' };
    }
    if (existingSubmission || existingTarget) {
      return { success: false, error: '该渠道已收录或正在审核，请勿重复提交' };
    }

    const { error } = await supabaseAdmin
      .from('user_target_submissions')
      .insert([
        {
          name,
          site_url: siteUrl,
          contact,
          remarks,
          status: 'pending'
        }
      ]);

    if (error) {
      console.error('Error submitting channel:', error);
      return { success: false, error: '提交失败，请稍后重试' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception submitting channel:', err);
    return { success: false, error: '系统异常，请稍后重试' };
  }
}

export async function submitFeedback(formData: FormData) {
  try {
    const offer_id = formData.get('offer_id') as string;
    const issue_type = formData.get('issue_type') as string;
    const description = formData.get('description') as string;

    if (!offer_id || !issue_type || !description) {
      return { success: false, error: '请填写所有必填项' };
    }

    const { error } = await supabaseAdmin
      .from('user_feedbacks')
      .insert([
        {
          offer_id,
          issue_type,
          description,
          status: 'pending'
        }
      ]);

    if (error) {
      console.error('Error submitting feedback:', error);
      return { success: false, error: '提交失败，请稍后重试' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception submitting feedback:', err);
    return { success: false, error: '系统异常，请稍后重试' };
  }
}
