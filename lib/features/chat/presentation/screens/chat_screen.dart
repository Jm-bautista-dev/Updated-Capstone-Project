import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_radius.dart';
import '../../../../core/theme/customer_luxury_theme.dart';
import '../../../../core/utils/responsive_layout.dart';
import '../../../../core/widgets/app_bars/lambac_app_bar.dart';
import '../../../../core/widgets/feedback/app_empty_states.dart';
import '../../../../core/widgets/feedback/app_toast.dart';
import '../../../../core/widgets/visuals/cinematic_roastery_background.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/message_model.dart';
import '../providers/chat_provider.dart';

/// Production Customer-to-Barista Concierge Chat Screen
/// Elevated with Apple-inspired messaging ergonomics, editorial luxury coffee typography,
/// and real-time bidirectional synchronization.
class ChatScreen extends ConsumerStatefulWidget {
  final String? customerId;
  const ChatScreen({super.key, this.customerId});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final List<String> _quickInquiries = [
    'Recommend grind for V60',
    'When is the next roast date?',
    'Best single-origin for espresso?',
    'Inquire about Order status',
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatNotifierProvider.notifier).loadChat(widget.customerId);
    });
  }

  @override
  void didUpdateWidget(covariant ChatScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.customerId != widget.customerId) {
      ref.read(chatNotifierProvider.notifier).loadChat(widget.customerId);
    }
  }

  void _onScroll() {
    if (_scrollController.hasClients && _scrollController.position.pixels <= 40) {
      ref.read(chatNotifierProvider.notifier).loadOlderMessages();
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage([String? presetText]) {
    final text = (presetText ?? _messageController.text).trim();
    if (text.isEmpty) return;
    if (text.length > 2000) {
      AppToast.error(context, 'Message cannot exceed 2000 characters.');
      return;
    }

    ref.read(chatNotifierProvider.notifier).sendMessage(text);

    if (presetText == null) {
      _messageController.clear();
    }

    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent + 100,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final currentUser = ref.watch(currentUserProvider);
    final chatState = ref.watch(chatNotifierProvider);
    final chatNotifier = ref.read(chatNotifierProvider.notifier);

    final isCustomerUser = currentUser?.isCustomer ?? true;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkCanvas : CustomerLuxuryTheme.warmCream,
      appBar: LambacAppBar(
        titleWidget: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: isDark ? AppColors.brandAmber.withOpacity(0.2) : AppColors.brandAmber.withOpacity(0.12),
                shape: BoxShape.circle,
                border: Border.all(
                  color: isDark ? AppColors.brandAmberLight.withOpacity(0.3) : AppColors.brandAmber.withOpacity(0.2),
                  width: 1.2,
                ),
              ),
              alignment: Alignment.center,
              child: Icon(
                isCustomerUser ? Icons.local_cafe_rounded : Icons.forum_rounded,
                size: 20,
                color: isDark ? AppColors.brandAmberLight : AppColors.brandAmberDark,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    isCustomerUser
                        ? 'Roastery Concierge'
                        : (chatState.conversation?.customerName ?? 'Customer Conversation'),
                    style: CustomerLuxuryTheme.editorialStyle(
                      isDark: isDark,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Row(
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: AppColors.matchaSage,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.matchaSage.withOpacity(0.4),
                              blurRadius: 4,
                              spreadRadius: 0.5,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        isCustomerUser
                            ? (chatState.isBaristaTyping ? 'Barista is typing...' : 'Master Barista Active')
                            : (currentUser?.isAdmin == true
                                ? 'Admin View â€¢ Shared Operational Thread'
                                : 'Barista View â€¢ Operations Thread'),
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: chatState.isBaristaTyping ? FontWeight.w600 : FontWeight.w500,
                          color: chatState.isBaristaTyping
                              ? (isDark ? AppColors.brandAmberLight : AppColors.brandAmber)
                              : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: CinematicRoasteryBackground.subtle(
        showAmbientParticles: false,
        showFloatingBean: false,
        child: SafeArea(
          child: ResponsiveContentContainer(
            maxWidth: 720,
            child: Column(
              children: [
                // Order Context Header Banner
                if (chatState.conversation?.orderReference != null)
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isDark
                          ? AppColors.brandAmber.withOpacity(0.12)
                          : AppColors.brandAmber.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark
                            ? AppColors.brandAmber.withOpacity(0.3)
                            : AppColors.brandAmber.withOpacity(0.35),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.brandAmber.withOpacity(0.2) : AppColors.brandAmber.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.receipt_long_rounded,
                            size: 16,
                            color: isDark ? AppColors.brandAmberLight : AppColors.brandAmber,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                chatState.conversation!.orderReference!,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: isDark ? AppColors.brandAmberLight : AppColors.brandAmberDark,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Linked Order Context â€¢ Shared Staff & Admin Access',
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                // Messages Scroll View or Empty State
                Expanded(
                  child: chatState.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : chatState.messages.isEmpty
                          ? AppEmptyChatState(
                              onStartChat: () => _sendMessage('Konnichiwa! I need brewing advice.'),
                            )
                          : ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              itemCount: chatState.messages.length + (chatState.isBaristaTyping ? 1 : 0),
                              itemBuilder: (context, index) {
                                // Typing Indicator Bubble
                                if (index == chatState.messages.length && chatState.isBaristaTyping) {
                                  return Align(
                                    alignment: Alignment.centerLeft,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                      decoration: BoxDecoration(
                                        color: isDark ? AppColors.darkSurfaceElevated : Colors.white,
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          SizedBox(
                                            width: 14,
                                            height: 14,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              valueColor: AlwaysStoppedAnimation<Color>(
                                                isDark ? AppColors.brandAmberLight : AppColors.brandAmber,
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'Hiro is typing a reply...',
                                            style: GoogleFonts.inter(
                                              fontSize: 12,
                                              fontStyle: FontStyle.italic,
                                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }

                                final msg = chatState.messages[index];
                                final isMe = msg.senderId == currentUser?.id ||
                                    (currentUser != null && msg.isFromCustomer && currentUser.isCustomer);

                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Align(
                                    alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                                    child: Container(
                                      constraints: BoxConstraints(
                                        maxWidth: MediaQuery.sizeOf(context).width * 0.78,
                                      ),
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                      decoration: BoxDecoration(
                                        color: isMe
                                            ? (msg.isFailed
                                                ? AppColors.error.withOpacity(0.9)
                                                : (isDark ? AppColors.brandAmberLight : AppColors.brandAmber))
                                            : (isDark ? AppColors.darkSurfaceElevated : Colors.white),
                                        borderRadius: BorderRadius.only(
                                          topLeft: const Radius.circular(16),
                                          topRight: const Radius.circular(16),
                                          bottomLeft: Radius.circular(isMe ? 16 : 4),
                                          bottomRight: Radius.circular(isMe ? 4 : 16),
                                        ),
                                        border: Border.all(
                                          color: isMe
                                              ? Colors.transparent
                                              : (isDark ? AppColors.darkBorder : CustomerLuxuryTheme.borderLight),
                                          width: 0.9,
                                        ),
                                        boxShadow: isDark ? CustomerLuxuryTheme.luxuryShadowDark : CustomerLuxuryTheme.luxuryShadowLight,
                                      ),
                                      child: Column(
                                        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                        children: [
                                          // Sender Header / Identification
                                          if (!isMe) ...[
                                            if (isCustomerUser) ...[
                                              // Customer sees unified business identity
                                              Text(
                                                'Lambac Coffee Roastery',
                                                style: GoogleFonts.inter(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w700,
                                                  color: isDark ? AppColors.brandAmberLight : AppColors.brandAmber,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                            ] else ...[
                                              // Staff and Admin see detailed internal role & sender tags
                                              if (msg.isFromCustomer) ...[
                                                Text(
                                                  'Customer â€¢ ${msg.senderName}',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w700,
                                                    color: isDark ? AppColors.brandAmberLight : AppColors.brandAmber,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                              ] else if (msg.isFromAdmin) ...[
                                                Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                                      decoration: BoxDecoration(
                                                        color: AppColors.info.withOpacity(0.2),
                                                        borderRadius: BorderRadius.circular(4),
                                                      ),
                                                      child: const Text(
                                                        'Admin',
                                                        style: TextStyle(
                                                          fontSize: 10,
                                                          fontWeight: FontWeight.w700,
                                                          color: AppColors.info,
                                                        ),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 6),
                                                    Text(
                                                      msg.senderName,
                                                      style: GoogleFonts.inter(
                                                        fontSize: 11,
                                                        fontWeight: FontWeight.w600,
                                                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 4),
                                              ] else if (msg.isFromBarista) ...[
                                                Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                                      decoration: BoxDecoration(
                                                        color: AppColors.brandAmber.withOpacity(0.2),
                                                        borderRadius: BorderRadius.circular(4),
                                                      ),
                                                      child: Text(
                                                        msg.isAiGenerated ? 'Roastery AI' : 'Barista',
                                                        style: const TextStyle(
                                                          fontSize: 10,
                                                          fontWeight: FontWeight.w700,
                                                          color: AppColors.brandAmber,
                                                        ),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 6),
                                                    Text(
                                                      msg.senderName,
                                                      style: GoogleFonts.inter(
                                                        fontSize: 11,
                                                        fontWeight: FontWeight.w600,
                                                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 4),
                                              ],
                                            ],
                                          ],
                                          Text(
                                            msg.text,
                                            style: GoogleFonts.inter(
                                              fontSize: 14,
                                              color: isMe
                                                  ? (isDark ? AppColors.darkCanvas : Colors.white)
                                                  : (isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary),
                                              height: 1.4,
                                            ),
                                          ),
                                          const SizedBox(height: 5),
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Text(
                                                _formatTime(msg.createdAt),
                                                style: GoogleFonts.inter(
                                                  fontSize: 10,
                                                  color: isMe
                                                      ? (isDark ? AppColors.darkCanvas.withOpacity(0.7) : Colors.white70)
                                                      : (isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary),
                                                ),
                                              ),
                                              if (isMe) ...[
                                                const SizedBox(width: 4),
                                                _buildStatusIndicator(msg, chatNotifier),
                                              ],
                                            ],
                                          ),
                                          if (msg.isFailed) ...[
                                            const SizedBox(height: 6),
                                            InkWell(
                                              onTap: () => chatNotifier.retryMessage(msg),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  const Icon(Icons.error_outline_rounded, size: 13, color: Colors.white),
                                                  const SizedBox(width: 4),
                                                  const Text(
                                                    "Message wasn't sent",
                                                    style: TextStyle(
                                                      fontSize: 11,
                                                      fontWeight: FontWeight.w600,
                                                      color: Colors.white,
                                                    ),
                                                  ),
                                                  const SizedBox(width: 6),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: Colors.white.withOpacity(0.25),
                                                      borderRadius: BorderRadius.circular(4),
                                                    ),
                                                    child: const Text(
                                                      'Retry',
                                                      style: TextStyle(
                                                        fontSize: 10,
                                                        fontWeight: FontWeight.w700,
                                                        color: Colors.white,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                ),

                // Quick Inquiries Chips (Customer only)
                if (isCustomerUser)
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: _quickInquiries.map((inquiry) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: InkWell(
                            onTap: () => _sendMessage(inquiry),
                            borderRadius: AppRadius.radiusPill,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.darkSurfaceElevated : Colors.white,
                                borderRadius: AppRadius.radiusPill,
                                border: Border.all(
                                  color: isDark ? AppColors.darkBorder : CustomerLuxuryTheme.borderLight,
                                  width: 0.9,
                                ),
                                boxShadow: isDark ? null : [
                                  BoxShadow(
                                    color: const Color(0xFF1E140C).withOpacity(0.03),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Text(
                                inquiry,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: isDark ? AppColors.brandAmberLight : AppColors.brandAmberDark,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),

                // Message Input Container
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkSurfaceElevated : Colors.white,
                    border: Border(
                      top: BorderSide(
                        color: isDark ? AppColors.darkBorder : CustomerLuxuryTheme.borderLight,
                        width: 1,
                      ),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _messageController,
                          maxLength: 2000,
                          buildCounter: (context, {required currentLength, required isFocused, maxLength}) => null,
                          onSubmitted: (_) => _sendMessage(),
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          ),
                          decoration: InputDecoration(
                            hintText: currentUser?.isAdmin == true
                                ? 'Reply as Admin...'
                                : (currentUser?.isEmployee == true
                                    ? 'Reply as Barista...'
                                    : 'Message barista...'),
                            hintStyle: GoogleFonts.inter(
                              fontSize: 13.5,
                              color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                            ),
                            filled: true,
                            fillColor: isDark ? AppColors.darkSurface : CustomerLuxuryTheme.lightOatCanvas,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            border: OutlineInputBorder(
                              borderRadius: AppRadius.radiusPill,
                              borderSide: BorderSide(
                                color: isDark ? AppColors.darkBorder : CustomerLuxuryTheme.borderLight,
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: AppRadius.radiusPill,
                              borderSide: BorderSide(
                                color: isDark ? AppColors.darkBorder : CustomerLuxuryTheme.borderLight,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: AppRadius.radiusPill,
                              borderSide: BorderSide(
                                color: isDark ? AppColors.brandAmberLight : AppColors.brandAmber,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Container(
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.brandAmberLight : AppColors.brandAmber,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.brandAmber.withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: IconButton(
                          icon: Icon(
                            Icons.arrow_upward_rounded,
                            color: isDark ? AppColors.darkCanvas : Colors.white,
                            size: 20,
                          ),
                          onPressed: () => _sendMessage(),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusIndicator(MessageModel msg, ChatNotifier notifier) {
    if (msg.isSending) {
      return const SizedBox(
        width: 10,
        height: 10,
        child: CircularProgressIndicator(strokeWidth: 1.5, valueColor: AlwaysStoppedAnimation<Color>(Colors.white70)),
      );
    } else if (msg.isFailed) {
      return GestureDetector(
        onTap: () => notifier.retryMessage(msg),
        child: const Icon(Icons.error_outline_rounded, size: 14, color: Colors.white),
      );
    }
    return const Icon(Icons.done_rounded, size: 12, color: Colors.white70);
  }

  String _formatTime(DateTime dt) {
    final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final period = dt.hour >= 12 ? 'PM' : 'AM';
    final min = dt.minute.toString().padLeft(2, '0');
    return '$hour:$min $period';
  }
}
