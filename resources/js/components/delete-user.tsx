import { Form } from '@inertiajs/react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import React, { useRef } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { destroy } from '@/routes/profile';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-4 pt-6 font-['Outfit']">
            <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="size-4" />
                </div>
                <div>
                    <h3 className="text-base font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                        Danger Zone
                    </h3>
                    <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                        Irreversible account termination & resource deletion
                    </p>
                </div>
            </div>

            <div className="p-6 rounded-3xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Delete Account Permanently
                    </p>
                    <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium max-w-md">
                        Once your account is deleted, all associated records, roles, and preferences will be permanently wiped.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="destructive"
                            data-test="delete-user-button"
                            className="h-11 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer shrink-0 gap-2"
                        >
                            <Trash2 className="size-4" />
                            <span>Delete Account</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-4xl p-6 bg-white dark:bg-[#181820] border-none shadow-2xl font-['Outfit']">
                        <DialogTitle className="text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                            Are you sure you want to delete your account?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-1">
                            Once your account is deleted, all resources will be permanently removed. Enter your account password to authorize deletion.
                        </DialogDescription>

                        <Form
                            {...destroy.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            onError={() => passwordInput.current?.focus()}
                            resetOnSuccess
                            className="space-y-4 mt-4"
                        >
                            {({ resetAndClearErrors, processing, errors }) => (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                                            Account Password
                                        </Label>

                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            ref={passwordInput}
                                            placeholder="Enter password to confirm"
                                            autoComplete="current-password"
                                            className="h-11 rounded-2xl bg-black/5 dark:bg-white/5 border-[#F8C8DC]/60 dark:border-white/10 text-xs"
                                        />

                                        <InputError message={errors.password} />
                                    </div>

                                    <DialogFooter className="gap-2 pt-2">
                                        <DialogClose asChild>
                                            <Button
                                                variant="outline"
                                                className="h-11 px-5 rounded-2xl font-bold text-xs border-[#F8C8DC]/60 dark:border-white/10 cursor-pointer"
                                                onClick={() => resetAndClearErrors()}
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>

                                        <Button
                                            variant="destructive"
                                            disabled={processing}
                                            asChild
                                            className="h-11 px-6 rounded-2xl font-black text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                                        >
                                            <button
                                                type="submit"
                                                data-test="confirm-delete-user-button"
                                            >
                                                Permanently Delete
                                            </button>
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
