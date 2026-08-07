import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { CheckCircle2, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import React, { useRef } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsLayout from '@/layouts/settings/layout';
import { update } from '@/routes/user-password';

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <SettingsLayout>
            <Head title="Password Settings" />

            <div className="space-y-8 font-['Outfit']">
                {/* Header */}
                <div className="space-y-1 border-b border-[#F8C8DC]/40 dark:border-white/10 pb-6">
                    <h2 className="text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Password & Security
                    </h2>
                    <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                        Ensure your account uses a long, complex password to protect system credentials.
                    </p>
                </div>

                <Form
                    {...update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    className="space-y-6 max-w-xl"
                >
                    {({ errors, processing, recentlySuccessful }) => (
                        <>
                            {/* Current Password Input */}
                            <div className="space-y-1.5">
                                <Label htmlFor="current_password" className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] ml-1">
                                    Current Password
                                </Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7D6B6E] dark:text-[#94A3B8]" />
                                    <Input
                                        id="current_password"
                                        ref={currentPasswordInput}
                                        name="current_password"
                                        type="password"
                                        className="pl-10 h-11 rounded-2xl bg-white dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium focus:ring-2 focus:ring-[#E75480]/20"
                                        autoComplete="current-password"
                                        placeholder="Current password"
                                    />
                                </div>
                                <InputError message={errors.current_password} />
                            </div>

                            {/* New Password Input */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] ml-1">
                                    New Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7D6B6E] dark:text-[#94A3B8]" />
                                    <Input
                                        id="password"
                                        ref={passwordInput}
                                        name="password"
                                        type="password"
                                        className="pl-10 h-11 rounded-2xl bg-white dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium focus:ring-2 focus:ring-[#E75480]/20"
                                        autoComplete="new-password"
                                        placeholder="New password"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Confirm Password Input */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation" className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] ml-1">
                                    Confirm New Password
                                </Label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7D6B6E] dark:text-[#94A3B8]" />
                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        className="pl-10 h-11 rounded-2xl bg-white dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium focus:ring-2 focus:ring-[#E75480]/20"
                                        autoComplete="new-password"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                                <InputError message={errors.password_confirmation} />
                            </div>

                            {/* Save Action */}
                            <div className="flex items-center gap-4 pt-2">
                                <Button
                                    disabled={processing}
                                    data-test="update-password-button"
                                    className="h-11 px-8 rounded-2xl font-black text-xs uppercase tracking-wider bg-[#E75480] hover:bg-[#D43F6B] text-white shadow-xs cursor-pointer"
                                >
                                    {processing ? 'Updating...' : 'Update Password'}
                                </Button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out duration-300"
                                    enterFrom="opacity-0 translate-x-2"
                                    enterTo="opacity-100 translate-x-0"
                                    leave="transition ease-in-out duration-300"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                        <CheckCircle2 className="size-4" />
                                        <span>Password updated</span>
                                    </p>
                                </Transition>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </SettingsLayout>
    );
}
