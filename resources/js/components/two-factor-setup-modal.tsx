import { Form } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Check, Copy, ScanLine } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { useAppearance } from '@/hooks/use-appearance';
import { useClipboard } from '@/hooks/use-clipboard';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { confirm } from '@/routes/two-factor';
import AlertError from './alert-error';
import { Spinner } from './ui/spinner';

function GridScanIcon() {
    return (
        <div className="mb-2 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7] dark:bg-[#181824] p-3 shadow-2xs">
            <ScanLine className="size-6 text-[#E75480] dark:text-[#FF4F81]" />
        </div>
    );
}

function TwoFactorSetupStep({
    qrCodeSvg,
    manualSetupKey,
    buttonText,
    onNextStep,
    errors,
}: {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    buttonText: string;
    onNextStep: () => void;
    errors: string[];
}) {
    const { resolvedAppearance } = useAppearance();
    const [copiedText, copy] = useClipboard();
    const IconComponent = copiedText === manualSetupKey ? Check : Copy;

    return (
        <div className="space-y-5 font-['Outfit'] w-full">
            {errors?.length ? (
                <AlertError errors={errors} />
            ) : (
                <>
                    <div className="mx-auto flex max-w-md overflow-hidden">
                        <div className="mx-auto aspect-square w-56 rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white/80 dark:bg-[#121218]/80 p-3 shadow-sm">
                            <div className="flex h-full w-full items-center justify-center">
                                {qrCodeSvg ? (
                                    <div
                                        className="aspect-square w-full rounded-2xl bg-white p-2 [&_svg]:size-full"
                                        dangerouslySetInnerHTML={{
                                            __html: qrCodeSvg,
                                        }}
                                        style={{
                                            filter:
                                                resolvedAppearance === 'dark'
                                                    ? 'invert(1) brightness(1.2)'
                                                    : undefined,
                                        }}
                                    />
                                ) : (
                                    <Spinner />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full">
                        <Button
                            type="button"
                            className="w-full h-11 rounded-2xl font-black text-xs uppercase tracking-wider bg-[#E75480] hover:bg-[#D43F6B] text-white shadow-xs cursor-pointer"
                            onClick={onNextStep}
                        >
                            {buttonText}
                        </Button>
                    </div>

                    <div className="relative flex w-full items-center justify-center">
                        <div className="absolute inset-0 top-1/2 h-px w-full bg-[#F8C8DC]/40 dark:bg-white/10" />
                        <span className="relative bg-white dark:bg-[#181820] px-3 text-[10px] font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                            Or Enter Setup Key Manually
                        </span>
                    </div>

                    <div className="flex w-full">
                        <div className="flex w-full items-center overflow-hidden rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7] dark:bg-[#181824]">
                            {!manualSetupKey ? (
                                <div className="flex h-11 w-full items-center justify-center p-3">
                                    <Spinner />
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        readOnly
                                        value={manualSetupKey}
                                        className="h-11 w-full bg-transparent px-3 text-xs font-mono font-bold text-[#3D2C2E] dark:text-[#F8FAFC] outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => copy(manualSetupKey)}
                                        className="h-11 border-l border-[#F8C8DC]/60 dark:border-white/10 px-4 hover:bg-black/5 dark:hover:bg-white/5 text-[#E75480] dark:text-[#FF4F81] cursor-pointer flex items-center justify-center"
                                    >
                                        <IconComponent className="size-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function TwoFactorVerificationStep({
    onClose,
    onBack,
}: {
    onClose: () => void;
    onBack: () => void;
}) {
    const [code, setCode] = useState<string>('');
    const pinInputContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => {
            pinInputContainerRef.current?.querySelector('input')?.focus();
        }, 0);
    }, []);

    return (
        <Form
            {...confirm.form()}
            onSuccess={() => onClose()}
            resetOnError
            resetOnSuccess
            className="w-full font-['Outfit']"
        >
            {({
                processing,
                errors,
            }: {
                processing: boolean;
                errors?: { confirmTwoFactorAuthentication?: { code?: string } };
            }) => (
                <div
                    ref={pinInputContainerRef}
                    className="relative w-full space-y-4"
                >
                    <div className="flex w-full flex-col items-center space-y-3 py-2">
                        <InputOTP
                            id="otp"
                            name="code"
                            maxLength={OTP_MAX_LENGTH}
                            onChange={setCode}
                            disabled={processing}
                            pattern={REGEXP_ONLY_DIGITS}
                        >
                            <InputOTPGroup className="gap-1.5">
                                {Array.from(
                                    { length: OTP_MAX_LENGTH },
                                    (_, index) => (
                                        <InputOTPSlot
                                            key={index}
                                            index={index}
                                            className="size-11 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 text-sm font-black font-mono"
                                        />
                                    )
                                )}
                            </InputOTPGroup>
                        </InputOTP>
                        <InputError
                            message={
                                errors?.confirmTwoFactorAuthentication?.code
                            }
                        />
                    </div>

                    <div className="flex w-full gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 h-11 rounded-2xl font-bold text-xs border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] cursor-pointer"
                            onClick={onBack}
                            disabled={processing}
                        >
                            Back
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 h-11 rounded-2xl font-black text-xs uppercase tracking-wider bg-[#E75480] hover:bg-[#D43F6B] text-white cursor-pointer"
                            disabled={
                                processing || code.length < OTP_MAX_LENGTH
                            }
                        >
                            {processing ? 'Confirming...' : 'Confirm'}
                        </Button>
                    </div>
                </div>
            )}
        </Form>
    );
}

type Props = {
    isOpen: boolean;
    onClose: () => void;
    requiresConfirmation: boolean;
    twoFactorEnabled: boolean;
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    clearSetupData: () => void;
    fetchSetupData: () => Promise<void>;
    errors: string[];
};

export default function TwoFactorSetupModal({
    isOpen,
    onClose,
    requiresConfirmation,
    twoFactorEnabled,
    qrCodeSvg,
    manualSetupKey,
    clearSetupData,
    fetchSetupData,
    errors,
}: Props) {
    const [showVerificationStep, setShowVerificationStep] =
        useState<boolean>(false);

    const modalConfig = useMemo<{
        title: string;
        description: string;
        buttonText: string;
    }>(() => {
        if (twoFactorEnabled) {
            return {
                title: 'Two-Factor Authentication Active',
                description:
                    'Two-factor authentication is now configured. You can scan the QR code or store your manual key for backup.',
                buttonText: 'Done',
            };
        }

        if (showVerificationStep) {
            return {
                title: 'Verify Authenticator Code',
                description:
                    'Enter the 6-digit verification pin from your authenticator application to confirm setup.',
                buttonText: 'Continue',
            };
        }

        return {
            title: 'Enable Two-Factor Protection',
            description:
                'Scan the QR code below using Google Authenticator, 1Password, or enter the manual key.',
            buttonText: 'Continue to Verification',
        };
    }, [twoFactorEnabled, showVerificationStep]);

    const handleModalNextStep = useCallback(() => {
        if (requiresConfirmation) {
            setShowVerificationStep(true);
            return;
        }

        clearSetupData();
        onClose();
    }, [requiresConfirmation, clearSetupData, onClose]);

    const resetModalState = useCallback(() => {
        setShowVerificationStep(false);

        if (twoFactorEnabled) {
            clearSetupData();
        }
    }, [twoFactorEnabled, clearSetupData]);

    useEffect(() => {
        if (isOpen && !qrCodeSvg) {
            fetchSetupData();
        }
    }, [isOpen, qrCodeSvg, fetchSetupData]);

    const handleClose = useCallback(() => {
        resetModalState();
        onClose();
    }, [onClose, resetModalState]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md rounded-4xl p-6 bg-white dark:bg-[#181820] border-none shadow-2xl font-['Outfit']">
                <DialogHeader className="flex flex-col items-center justify-center text-center space-y-1">
                    <GridScanIcon />
                    <DialogTitle className="text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        {modalConfig.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium leading-relaxed">
                        {modalConfig.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center space-y-5 pt-2">
                    {showVerificationStep ? (
                        <TwoFactorVerificationStep
                            onClose={onClose}
                            onBack={() => setShowVerificationStep(false)}
                        />
                    ) : (
                        <TwoFactorSetupStep
                            qrCodeSvg={qrCodeSvg}
                            manualSetupKey={manualSetupKey}
                            buttonText={modalConfig.buttonText}
                            onNextStep={handleModalNextStep}
                            errors={errors}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
