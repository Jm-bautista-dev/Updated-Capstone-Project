import { MessageSquare } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RatingStars } from './RatingStars';
import type { ReviewItem } from './types';

interface ReviewRespondModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    review: ReviewItem | null;
    onSubmit: (review: ReviewItem, responseText: string) => void;
    isSubmitting?: boolean;
}

interface RespondFormProps {
    review: ReviewItem;
    onSubmit: (review: ReviewItem, responseText: string) => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

const RespondForm: React.FC<RespondFormProps> = ({
    review,
    onSubmit,
    onCancel,
    isSubmitting,
}) => {
    const [responseText, setResponseText] = useState(review.admin_response || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!responseText.trim() || isSubmitting) return;
        onSubmit(review, responseText.trim());
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {/* Customer Review Context Box */}
            <div className="bg-slate-50 dark:bg-[#181924] p-3.5 rounded-xl border border-slate-200/70 dark:border-white/6">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                        {review.user?.name || 'Customer'}
                    </span>
                    <RatingStars rating={review.rating} size="xs" showScore />
                </div>
                <p className="text-slate-600 dark:text-slate-300 italic text-xs leading-relaxed">
                    "{review.comment || 'Rating submitted without written comment.'}"
                </p>
            </div>

            {/* Official Response Input Area */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Official Response Text
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                        {responseText.length}/1000
                    </span>
                </div>
                <Textarea
                    rows={4}
                    maxLength={1000}
                    placeholder="Thank the customer for their dining feedback or provide operational clarity..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="rounded-xl bg-white dark:bg-[#181924] border-slate-200 dark:border-white/8 text-xs resize-none focus-visible:ring-1 focus-visible:ring-[#FF3366]"
                    required
                />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="rounded-xl font-bold text-xs cursor-pointer text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting || !responseText.trim()}
                    className="rounded-xl font-bold bg-[#FF3366] hover:bg-[#E1062C] text-white px-4 text-xs shadow-md cursor-pointer"
                >
                    {isSubmitting ? 'Saving...' : review.admin_response ? 'Update Response' : 'Post Official Response'}
                </Button>
            </DialogFooter>
        </form>
    );
};

export const ReviewRespondModal: React.FC<ReviewRespondModalProps> = ({
    open,
    onOpenChange,
    review,
    onSubmit,
    isSubmitting = false,
}) => {
    if (!review) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden border border-slate-200 dark:border-white/8 shadow-2xl bg-white dark:bg-[#12131A] backdrop-blur-2xl">
                {/* Header Banner */}
                <div className="bg-linear-to-r from-[#FF3366] to-[#E1062C] p-5 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                            <MessageSquare className="size-4.5" />
                            {review.admin_response ? 'Edit Official Response' : 'Reply to Customer Review'}
                        </DialogTitle>
                        <DialogDescription className="text-white/80 font-medium text-xs mt-0.5">
                            Post an official public statement for {review.user?.name || 'Customer'}'s review.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <RespondForm
                    key={`${review.id}-${review.admin_response || ''}`}
                    review={review}
                    onSubmit={onSubmit}
                    onCancel={() => onOpenChange(false)}
                    isSubmitting={isSubmitting}
                />
            </DialogContent>
        </Dialog>
    );
};
