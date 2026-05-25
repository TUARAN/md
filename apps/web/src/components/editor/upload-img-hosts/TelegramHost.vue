<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup'
import { Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { secureStore } from '@/utils/secureStore'
import { toast } from '@/utils/toast'

const schema = toTypedSchema(yup.object({
  token: yup.string().required(`Bot Token 不能为空`),
  chatId: yup.string().required(`Chat ID 不能为空`),
}))

const config = secureStore.reactiveJSON(`telegramConfig`, { token: ``, chatId: `` })

async function onSubmit(values: typeof config.value) {
  Object.assign(config.value, values)
  toast.success(`保存成功`)
}
</script>

<template>
  <Form :validation-schema="schema" :initial-values="config" class="flex flex-col flex-1 overflow-hidden" @submit="onSubmit">
    <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <Field v-slot="{ field, errorMessage }" name="token">
        <FormItem label="Bot Token" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：123456789:ABCdefGHIjkl-MNOPqrSTUvwxYZ" />
        </FormItem>
      </Field>
      <Field v-slot="{ field, errorMessage }" name="chatId">
        <FormItem label="Chat ID" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：-1001234567890" />
        </FormItem>
      </Field>
      <FormItem>
        <Button
          variant="link"
          class="p-0 h-auto text-left whitespace-normal"
          as="a"
          href="https://github.com/doocs/md/blob/main/docs/telegram-usage.md"
          target="_blank"
        >
          如何使用 Telegram？
        </Button>
      </FormItem>
    </div>

    <DialogFooter class="p-1">
      <Button type="submit">
        保存配置
      </Button>
    </DialogFooter>
  </Form>
</template>
