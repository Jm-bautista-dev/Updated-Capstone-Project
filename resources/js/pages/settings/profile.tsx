import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Mail, User as UserIcon } from 'lucide-react';
import React from 'react';

import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsLayout from '@/layouts/settings/layout';
import { update } from '@/routes/profile';
import { send } from '@/routes/verification';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;

    return (
        <SettingsLayout>
            <Head title="Profile Settings" />

            <div className="space-y-8 font-['Outfit']">
                {/* Header */}
                <div className="space-y-1 border-b border-[#F8C8DC]/40 dark:border-white/10 pb-6">
                    <h2 className="text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Profile Information
                    </h2>
                    <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                        Update your account display name and primary email address.
                    </p>
                </div>

                <Form
                    {...update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6 max-w-xl"
                >
                    {({ processing, recentlySuccessful, errors }) => (
                        <>
                            {/* Name Input */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] ml-1">
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7D6B6E] dark:text-[#94A3B8]" />
                                    <Input
                                        id="name"
                                        className="pl-10 h-11 rounded-2xl bg-white dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium focus:ring-2 focus:ring-[#E75480]/20"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />
                                </div>
                                <InputError className="mt-1" message={errors.name} />
                            </div>

                            {/* Email Input */}
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] ml-1">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#7D6B6E] dark:text-[#94A3B8]" />
                                    <Input
                                        id="email"
                                        type="email"
                                        className="pl-10 h-11 rounded-2xl bg-white dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium focus:ring-2 focus:ring-[#E75480]/20"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />
                                </div>
                                <InputError className="mt-1" message={errors.email} />
                            </div>

                            {/* Verification Warning */}
                            {mustVerifyEmail && auth.user.email_verified_at === null && (
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-medium">
                                    <p>
                                        Your email address is unverified.{' '}
                                        <Link
                                            href={send()}
                                            as="button"
                                            className="font-bold underline hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                                        >
                                            Click here to resend verification email.
                                        </Link>
                                    </p>

                                    {status === 'verification-link-sent' && (
                                        <div className="mt-2 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                            <CheckCircle2 className="size-4" />
                                            <span>A new verification link has been sent to your email address.</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Save Action */}
                            <div className="flex items-center gap-4 pt-2">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                    className="h-11 px-8 rounded-2xl font-black text-xs uppercase tracking-wider bg-[#E75480] hover:bg-[#D43F6B] text-white shadow-xs cursor-pointer"
                                >
                                    {processing ? 'Saving...' : 'Save Profile'}
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
                                        <span>Saved successfully</span>
                                    </p>
                                </Transition>
                            </div>
                        </>
                    )}
                </Form>

                <div className="border-t border-[#F8C8DC]/40 dark:border-white/10 pt-6">
                    <DeleteUser />
                </div>
            </div>
        </SettingsLayout>
    );
}
