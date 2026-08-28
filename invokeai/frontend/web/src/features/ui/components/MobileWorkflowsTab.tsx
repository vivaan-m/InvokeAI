import { Box, Divider, Flex, Heading, Icon, IconButton, Input, InputGroup, InputRightElement, Tab, TabList, Tabs, Text } from '@invoke-ai/ui-library';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { ImageViewerPanel } from 'features/gallery/components/ImageViewer/ImageViewerPanel';
import { WorkflowList } from 'features/nodes/components/sidePanel/workflow/WorkflowLibrary/WorkflowList';
import WorkflowsTabLeftPanel from 'features/nodes/components/sidePanel/WorkflowsTabLeftPanel';
import { selectWorkflowId } from 'features/nodes/store/selectors';
import { useWorkflowLibraryModal } from 'features/nodes/store/workflowLibraryModal';
import {
  selectWorkflowLibrarySearchTerm,
  workflowLibrarySearchTermChanged,
} from 'features/nodes/store/workflowLibrarySlice';
import { AutoLayoutProvider } from 'features/ui/layouts/auto-layout-context';
import { LaunchpadButton } from 'features/ui/layouts/LaunchpadButton';
import { useLoadWorkflowWithDialog } from 'features/workflowLibrary/components/LoadWorkflowConfirmationAlertDialog';
import { useNewWorkflow } from 'features/workflowLibrary/components/NewWorkflowConfirmationAlertDialog';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { memo, useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { PiFilePlusBold, PiFolderOpenBold, PiUploadBold, PiXBold } from 'react-icons/pi';

/**
 * Phone-width layout for the Workflows tab. The node-graph editor is not usable on a phone, so the
 * two things a phone user needs are surfaced instead:
 *
 * - `Browse` — a compact launchpad (browse templates / create / load from file) plus the saved
 *   workflows list with a phone-width search, to open and run workflows.
 * - `Workflow` — once a workflow is opened, its input form and run controls (the same left-panel
 *   content as desktop: queue controls, name/actions, description, and the form fields). This is the
 *   "more sections" that only appear after a workflow is opened on desktop.
 *
 * Workflow cards are full-width here (the desktop grid's `minmax(360px, 1fr)` already collapses to a
 * single column on phone widths).
 */
export const MobileWorkflowsTab = memo(() => {
  const workflowId = useAppSelector(selectWorkflowId);
  const { t } = useTranslation();
  const [subView, setSubView] = useState(0);

  // Views: 0 = Browse (launchpad + saved workflows), 1 = active Workflow (form/run), 2 = Viewer.
  // When no workflow is active, the Workflow tab is meaningless — clamp to Browse or Viewer.
  const activeView = workflowId ? subView : subView === 1 ? 0 : subView;

  return (
    <AutoLayoutProvider tab="workflows">
      <Flex flexDir="column" w="full" h="full">
        <Tabs
          index={activeView}
          onChange={setSubView}
          flexShrink={0}
          display="flex"
          flexDir="column"
          variant="line"
        >
          <TabList>
            <Tab>{t('ui.mobile.workflowsBrowse')}</Tab>
            {workflowId && <Tab>{t('ui.mobile.workflowsActive')}</Tab>}
            <Tab>{t('ui.mobile.workflowsViewer')}</Tab>
          </TabList>
        </Tabs>
        <Box flex={1} minH={0}>
          {activeView === 0 && <MobileWorkflowsBrowse />}
          {activeView === 1 && workflowId && <MobileWorkflowsActive />}
          {activeView === 2 && <MobileWorkflowsViewer />}
        </Box>
      </Flex>
    </AutoLayoutProvider>
  );
});

MobileWorkflowsTab.displayName = 'MobileWorkflowsTab';

/**
 * Browse view: compact launchpad + saved workflows list. The list owns its own scroll + infinite
 * pagination, so it gets a bounded height region while the launchpad stays pinned above it.
 */
const MobileWorkflowsBrowse = memo(() => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const searchTerm = useAppSelector(selectWorkflowLibrarySearchTerm);

  const workflowLibraryModal = useWorkflowLibraryModal();
  const newWorkflow = useNewWorkflow();
  const loadWorkflowWithDialog = useLoadWorkflowWithDialog();

  const handleBrowseTemplates = useCallback(() => {
    workflowLibraryModal.open();
  }, [workflowLibraryModal]);

  const handleCreateNew = useCallback(() => {
    newWorkflow.createWithDialog();
  }, [newWorkflow]);

  const onDropAccepted = useCallback(
    ([file]: File[]) => {
      if (!file) {
        return;
      }
      loadWorkflowWithDialog({ type: 'file', data: file });
    },
    [loadWorkflowWithDialog]
  );

  const uploadApi = useDropzone({
    accept: { 'application/json': ['.json'] },
    onDropAccepted,
    noDrag: true,
    multiple: false,
  });

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(workflowLibrarySearchTermChanged(e.target.value));
    },
    [dispatch]
  );

  const clearSearch = useCallback(() => {
    dispatch(workflowLibrarySearchTermChanged(''));
  }, [dispatch]);

  const handleSearchKeydown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // Exit search mode on escape.
      if (e.key === 'Escape') {
        clearSearch();
      }
    },
    [clearSearch]
  );

  return (
    <Flex flexDir="column" w="full" h="full">
      {/* Launchpad actions (browse / create / load) — pinned above the list. */}
      <Flex flexShrink={0} flexDir="column" p={2} gap={2}>
        <Heading size="md">{t('ui.launchpad.workflowsTitle')}</Heading>
        <Flex flexDir="column" gap={2}>
          <LaunchpadButton onClick={handleBrowseTemplates} gap={4} py={4}>
            <Icon as={PiFolderOpenBold} boxSize={6} color="base.500" />
            <Flex flexDir="column" alignItems="flex-start" gap={1}>
              <Heading size="sm">{t('ui.launchpad.workflows.browseTemplates.title')}</Heading>
              <Text color="base.300" fontSize="sm">
                {t('ui.launchpad.workflows.browseTemplates.description')}
              </Text>
            </Flex>
          </LaunchpadButton>

          <LaunchpadButton onClick={handleCreateNew} gap={4} py={4}>
            <Icon as={PiFilePlusBold} boxSize={6} color="base.500" />
            <Flex flexDir="column" alignItems="flex-start" gap={1}>
              <Heading size="sm">{t('ui.launchpad.workflows.createNew.title')}</Heading>
              <Text color="base.300" fontSize="sm">
                {t('ui.launchpad.workflows.createNew.description')}
              </Text>
            </Flex>
          </LaunchpadButton>

          <LaunchpadButton {...uploadApi.getRootProps()} gap={4} py={4}>
            <Icon as={PiUploadBold} boxSize={6} color="base.500" />
            <Flex flexDir="column" alignItems="flex-start" gap={1}>
              <Heading size="sm">{t('ui.launchpad.workflows.loadFromFile.title')}</Heading>
              <Text color="base.300" fontSize="sm">
                {t('ui.launchpad.workflows.loadFromFile.description')}
              </Text>
            </Flex>
            <input {...uploadApi.getInputProps()} />
          </LaunchpadButton>
        </Flex>
      </Flex>

      <Divider />

      {/* Saved workflows — the list owns its own scroll + infinite pagination. */}
      <Flex flexDir="column" flex={1} minH={0}>
        <Flex flexShrink={0} alignItems="center" gap={2} px={2} pt={2} pb={2}>
          <Heading size="sm" flexShrink={0}>
            {t('workflows.workflowLibrary')}
          </Heading>
          <InputGroup w="full">
            <Input
              placeholder={t('workflows.searchPlaceholder')}
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeydown}
            />
            {searchTerm && searchTerm.length > 0 && (
              <InputRightElement h="full" pe={2}>
                <IconButton
                  onClick={clearSearch}
                  size="sm"
                  variant="link"
                  aria-label={t('boards.clearSearch')}
                  icon={<PiXBold />}
                />
              </InputRightElement>
            )}
          </InputGroup>
        </Flex>
        <Box flex={1} minH={0}>
          <WorkflowList />
        </Box>
      </Flex>
    </Flex>
  );
});

MobileWorkflowsBrowse.displayName = 'MobileWorkflowsBrowse';

/**
 * Active-workflow view: reuses the exact desktop left-panel composition (queue controls, workflow
 * name/actions, description, and the view/edit form fields). The view-mode form already scrolls via
 * `ScrollableContent`; the edit-mode variant is the node authoring UI (best left to desktop, but the
 * toggle is preserved so behaviour matches desktop).
 */
// Reuses the exact desktop left-panel composition. It is built around `h="full"` chains (QueueControls
// + the form region, each resolving height from a definite-height ancestor). On desktop that ancestor is
// `AutoLayoutPanelContainer` (`h="full"`); here we supply the same bounded height so the form fills the
// remaining space and scrolls instead of collapsing to zero height.
const MobileWorkflowsActive = memo(() => {
  return (
    <Flex flexDir="column" w="full" h="full">
      <WorkflowsTabLeftPanel />
    </Flex>
  );
});

MobileWorkflowsActive.displayName = 'MobileWorkflowsActive';

/**
 * Viewer view: the image viewer (zoomable, compare) — the same component used by the Generate tab. It
 * needs only a bounded height region, which the parent `Box flex={1} minH={0}` provides.
 */
const MobileWorkflowsViewer = memo(() => {
  return (
    <Box w="full" h="full">
      <ImageViewerPanel />
    </Box>
  );
});

MobileWorkflowsViewer.displayName = 'MobileWorkflowsViewer';
