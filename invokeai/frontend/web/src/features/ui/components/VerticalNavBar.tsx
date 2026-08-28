import { Divider, Flex, Spacer } from '@invoke-ai/ui-library';
import { useIsMobile } from 'common/hooks/useIsMobile';
import { UserMenu } from 'features/auth/components/UserMenu';
import { useIsCustomNodesEnabled } from 'features/customNodes/useIsCustomNodesEnabled';
import InvokeAILogoComponent from 'features/system/components/InvokeAILogoComponent';
import SettingsMenu from 'features/system/components/SettingsModal/SettingsMenu';
import StatusIndicator from 'features/system/components/StatusIndicator';
import { VideosModalButton } from 'features/system/components/VideosModal/VideosModalButton';
import type { TabName } from 'features/ui/store/uiTypes';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PiBoundingBoxBold,
  PiCircuitryBold,
  PiCubeBold,
  PiFlowArrowBold,
  PiFrameCornersBold,
  PiQueueBold,
  PiTextAaBold,
} from 'react-icons/pi';

import { Notifications } from './Notifications';
import { TabButton } from './TabButton';

export const VerticalNavBar = memo(() => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileBottomNav />;
  }

  return <DesktopNavBar />;
});

VerticalNavBar.displayName = 'VerticalNavBar';

const DesktopNavBar = memo(() => {
  const { t } = useTranslation();
  const { isAllowed: isCustomNodesAllowed } = useIsCustomNodesEnabled();

  return (
    <Flex flexDir="column" alignItems="center" py={6} ps={4} pe={2} gap={4} minW={0} flexShrink={0}>
      <InvokeAILogoComponent />

      <Flex gap={6} pt={6} h="full" flexDir="column">
        <TabButton tab="generate" icon={<PiTextAaBold />} label={t('ui.tabs.generate')} />
        <TabButton tab="canvas" icon={<PiBoundingBoxBold />} label={t('ui.tabs.canvas')} />
        <TabButton tab="upscaling" icon={<PiFrameCornersBold />} label={t('ui.tabs.upscaling')} />
        <TabButton tab="workflows" icon={<PiFlowArrowBold />} label={t('ui.tabs.workflows')} />
      </Flex>

      <Spacer />

      <StatusIndicator />
      <TabButton tab="models" icon={<PiCubeBold />} label={t('ui.tabs.models')} />
      {isCustomNodesAllowed && (
        <TabButton tab="customNodes" icon={<PiCircuitryBold />} label={t('ui.tabs.customNodes')} />
      )}
      <TabButton tab="queue" icon={<PiQueueBold />} label={t('ui.tabs.queue')} />

      <Divider />

      <UserMenu />
      <Notifications />
      <VideosModalButton />
      <SettingsMenu />
    </Flex>
  );
});
DesktopNavBar.displayName = 'DesktopNavBar';

/**
 * On phone-width screens the vertical icon sidebar is replaced by a horizontal bottom nav bar so
 * the full viewport width is available to content. Each tab is a full-width flex cell so the
 * whole width is tappable (not just the 24px icon), and the bar respects the iOS safe-area
 * inset so icons never sit under the home indicator.
 */
const MobileBottomNav = memo(() => {
  const { t } = useTranslation();
  const { isAllowed: isCustomNodesAllowed } = useIsCustomNodesEnabled();

  const navItem = (tab: TabName, icon: ReactElement, label: string) => (
    <Flex key={tab} flex={1} alignItems="center" justifyContent="center" minH={14}>
      <TabButton tab={tab} icon={icon} label={label} />
    </Flex>
  );

  return (
    <Flex
      flexDir="row"
      alignItems="stretch"
      w="full"
      flexShrink={0}
      bg="base.900"
      borderTopWidth={1}
      borderTopColor="base.700"
      position="relative"
      px={1}
      style={{
        paddingTop: 'max(env(safe-area-inset-bottom), 4px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {navItem('generate', <PiTextAaBold />, t('ui.tabs.generate'))}
      {navItem('canvas', <PiBoundingBoxBold />, t('ui.tabs.canvas'))}
      {navItem('upscaling', <PiFrameCornersBold />, t('ui.tabs.upscaling'))}
      {navItem('workflows', <PiFlowArrowBold />, t('ui.tabs.workflows'))}
      {navItem('models', <PiCubeBold />, t('ui.tabs.models'))}
      {isCustomNodesAllowed && navItem('customNodes', <PiCircuitryBold />, t('ui.tabs.customNodes'))}
      {navItem('queue', <PiQueueBold />, t('ui.tabs.queue'))}
    </Flex>
  );
});
MobileBottomNav.displayName = 'MobileBottomNav';
