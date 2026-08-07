import { Form } from '@inertiajs/react';
import { Eye, EyeOff, LockKeyhole, RefreshCw, ShieldAlert } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { regenerateRecoveryCodes } from '@/routes/two-factor';
import AlertError from './alert-error';

type Props = {
    recoveryCodesList: string[];
    fetchRecoveryCodes: () => Promise<void>;
    errors: string[];
};

export default function TwoFactorRecoveryCodes({
    recoveryCodesList,
    fetchRecoveryCodes,
    errors,
}: Props) {
    const [codesAreVisible, setCodesAreVisible] = useState<boolean>(false);
    const codesSectionRef = useRef<HTMLDivElement | null>(null);
    const canRegenerateCodes = recoveryCodesList.length > 0 && codesAreVisible;

    const toggleCodesVisibility = useCallback(async () => {
        if (!codesAreVisible && !recoveryCodesList.length) {
            await fetchRecoveryCodes();
        }

        setCodesAreVisible(!codesAreVisible);

        if (!codesAreVisible) {
            setTimeout(() => {
                codesSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            });
        }
    }, [codesAreVisible, recoveryCodesList.length, fetchRecoveryCodes]);

    useEffect(() => {
        if (!recoveryCodesList.length) {
            fetchRecoveryCodes();
        }
    }, [recoveryCodesList.length, fetchRecoveryCodes]);

    const RecoveryCodeIconComponent = codesAreVisible ? EyeOff : Eye;

    return (
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-[#F8C8DC]/60 dark:border-white/10 shadow-xs backdrop-blur-xl space-y-4 font-['Outfit']">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81]">
                        <LockKeyhole className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                            Emergency Recovery Codes
                        </h4>
                        <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-0.5">
                            Keep these backup codes secure to retain account access if mobile 2FA device is lost.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={toggleCodesVisibility}
                        aria-expanded={codesAreVisible}
                        aria-controls="recovery-codes-section"
                        className="h-10 px-4 rounded-2xl text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] gap-2 cursor-pointer"
                    >
                        <RecoveryCodeIconComponent className="size-4" aria-hidden="true" />
                        <span>{codesAreVisible ? 'Hide' : 'View'} Backup Codes</span>
                    </Button>

                    {canRegenerateCodes && (
                        <Form
                            {...regenerateRecoveryCodes.form()}
                            options={{ preserveScroll: true }}
                            onSuccess={fetchRecoveryCodes}
                        >
                            {({ processing }) => (
                                <Button
                                    variant="secondary"
                                    type="submit"
                                    disabled={processing}
                                    aria-describedby="regenerate-warning"
                                    className="h-10 px-4 rounded-2xl text-xs font-bold bg-[#FFF5F7] dark:bg-[#181824] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/40 dark:border-white/10 gap-2 cursor-pointer"
                                >
                                    <RefreshCw className="size-3.5" />
                                    <span>Regenerate</span>
                                </Button>
                            )}
                        </Form>
                    )}
                </div>
            </div>

            <div
                id="recovery-codes-section"
                className={`relative overflow-hidden transition-all duration-300 ${codesAreVisible ? 'h-auto opacity-100 mt-4' : 'h-0 opacity-0'}`}
                aria-hidden={!codesAreVisible}
            >
                <div className="space-y-3">
                    {errors?.length ? (
                        <AlertError errors={errors} />
                    ) : (
                        <>
                            <div
                                ref={codesSectionRef}
                                className="grid grid-cols-2 gap-2 rounded-2xl bg-[#FFF5F7]/80 dark:bg-[#181824]/80 p-4 border border-[#F8C8DC]/40 dark:border-white/10 font-mono text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]"
                                role="list"
                                aria-label="Recovery codes"
                            >
                                {recoveryCodesList.length ? (
                                    recoveryCodesList.map((code, index) => (
                                        <div
                                            key={index}
                                            role="listitem"
                                            className="p-2 rounded-xl bg-white/60 dark:bg-[#121218]/60 border border-[#F8C8DC]/30 dark:border-white/5 text-center select-all tracking-wider"
                                        >
                                            {code}
                                        </div>
                                    ))
                                ) : (
                                    <div
                                        className="col-span-2 space-y-2"
                                        aria-label="Loading recovery codes"
                                    >
                                        {Array.from({ length: 8 }, (_, index) => (
                                            <div
                                                key={index}
                                                className="h-6 animate-pulse rounded-xl bg-black/10 dark:bg-white/10"
                                                aria-hidden="true"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-medium">
                                <ShieldAlert className="size-4 shrink-0" />
                                <p id="regenerate-warning">
                                    Each recovery code can be used once to access your account. Regenerating invalidates previous codes.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
