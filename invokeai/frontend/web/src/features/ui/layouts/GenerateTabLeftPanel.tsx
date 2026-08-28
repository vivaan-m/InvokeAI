import { Box, Flex } from '@invoke-ai/ui-library';
import { useIsMobile } from 'common/hooks/useIsMobile';
import QueueControls from 'features/queue/components/QueueControls';
import { ParametersPanelGenerate } from 'features/ui/components/ParametersPanels/ParametersPanelGenerate';
import { memo } from 'react';

export const GenerateTabLeftPanel = memo(({ hideInvokeButton = false }: { hideInvokeButton?: boolean }) => {
  const isMobile = useIsMobile();

  return (
    <Flex flexDir="column" w="full" h={isMobile ? 'unset' : 'full'} gap={2}>
      {!hideInvokeButton && <QueueControls />}
      <Box position="relative" w="full" h={isMobile ? 'unset' : 'full'}>
        <ParametersPanelGenerate />
      </Box>
    </Flex>
  );
});
GenerateTabLeftPanel.displayName = 'GenerateTabLeftPanel';
