#!/bin/bash
cd /home/kavia/workspace/code-generation/focuswrite-16354-55329e54/focuswrite
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

