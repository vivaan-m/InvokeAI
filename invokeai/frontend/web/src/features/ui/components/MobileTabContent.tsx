import { Box, Flex, Spinner, Tab, TabList, TabPanel, TabPanels, Tabs } from '@invoke-ai/ui-library';
import { useAppSelector } from 'app/store/storeHooks';
import { useIsCustomNodesEnabled } from 'features/customNodes/useIsCustomNodesEnabled';
import { BoardsListWrapper } from 'features/gallery/components/Boards/BoardsList/BoardsListWrapper';
import { GalleryImageGrid } from 'features/gallery/components/GalleryImageGrid';
import { ImageViewerPanel } from 'features/gallery/components/ImageViewer/ImageViewerPanel';
import { InvokeButton } from 'features/queue/components/InvokeQueueBackButton';
import { AutoLayoutProvider } from 'features/ui/layouts/auto-layout-context';
import { GenerateTabLeftPanel } from 'features/ui/layouts/GenerateTabLeftPanel';
import { navigationApi } from 'features/ui/layouts/navigation-api';
import { selectActiveTab } from 'features/ui/store/uiSelectors';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MobileWorkflowsTab } from './MobileWorkflowsTab';

export const MobileTabContent = memo(() => {
  const tab = useAppSelector(selectActiveTab);

  if (tab === 'generate') {
    return <MobileGenerateTab />;
  }

  if (tab === 'workflows') {
    return <MobileWorkflowsTab />;
  }

  // Other tabs currently keep the desktop dockview experience. They remain usable on tablets; on
  // small phones they are not yet re-flowed (out of scope for the first mobile pass).
  return <DesktopTabFallback tab={tab} />;
});

MobileTabContent.displayName = 'MobileTabContent';

const MOBILE_GALLERY_TAB = 0;

/**
 * Phone-width layout for the Generate tab. The parameters and gallery/viewer/boards live in a
 * scrollable body, while the Generate (Invoke) action is pinned to a fixed action bar above the
 * bottom nav so it is always thumb-reachable, even after scrolling down to the prompt. A single
 * Invoke button is shown (the top-of-parameters one is hidden) to avoid a duplicate CTA.
 */
const MobileGenerateTab = memo(() => {
  const { t } = useTranslation();
  const [subView, setSubView] = useState<number>(MOBILE_GALLERY_TAB);

  return (
    <AutoLayoutProvider tab="generate">
      <Flex flexDir="column" w="full" h="full">
        <Box flex={1} overflowY="auto" overflowX="hidden" gap={2} p={2}>
          <GenerateTabLeftPanel hideInvokeButton />
          <Tabs
            index={subView}
            onChange={setSubView}
            w="full"
            flexShrink={0}
            display="flex"
            flexDir="column"
            variant="line"
          >
            <TabList>
              <Tab>{t('ui.tabs.gallery')}</Tab>
              <Tab>{t('ui.panels.imageViewer')}</Tab>
              <Tab>{t('boards.boards')}</Tab>
            </TabList>
            <TabPanels>
              <TabPanel p={0} pt={2} w="full">
                <Box w="full" h="60vh">
                  <GalleryImageGrid />
                </Box>
              </TabPanel>
              <TabPanel p={0} pt={2} w="full">
                <Box w="full" h="60vh">
                  <ImageViewerPanel />
                </Box>
              </TabPanel>
              <TabPanel p={0} pt={2} w="full">
                <Box w="full" h="60vh">
                  <BoardsListWrapper />
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
        <Flex
          flexShrink={0}
          w="full"
          bg="base.900"
          borderTopWidth={1}
          borderTopColor="base.700"
          px={2}
          py={2}
          alignItems="center"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
          aria-label={t('ui.mobile.generateActionBar')}
        >
          <InvokeButton fullWidth />
        </Flex>
      </Flex>
    </AutoLayoutProvider>
  );
});
MobileGenerateTab.displayName = 'MobileGenerateTab';

/**
 * Thin wrapper so non-generate tabs still render on mobile. Renders a small spinner + message;
 * the dockview-based layouts are mounted by the desktop path and are usable on tablet widths.
 */
const DesktopTabFallback = memo(({ tab }: { tab: string }) => {
  const { t } = useTranslation();
  const { isKnown: isCustomNodesKnown, isAllowed: isCustomNodesAllowed } = useIsCustomNodesEnabled();

  // Redirect away from customNodes only once we know the user is denied.
  useEffect(() => {
    if (tab === 'customNodes' && isCustomNodesKnown && !isCustomNodesAllowed) {
      navigationApi.switchToTab('generate');
    }
  }, [tab, isCustomNodesKnown, isCustomNodesAllowed]);

  return (
    <Flex w="full" h="full" alignItems="center" justifyContent="center" flexDir="column" gap={3} p={4}>
      <Spinner size="xl" />
      <Box fontSize="sm" color="base.300" textAlign="center">
        {t('ui.mobile.desktopOnlyTab')}
      </Box>
    </Flex>
  );
});
DesktopTabFallback.displayName = 'DesktopTabFallback';
