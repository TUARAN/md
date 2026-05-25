<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup'
import { Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { secureStore } from '@/utils/secureStore'
import { toast } from '@/utils/toast'

const schema = toTypedSchema(yup.object({
  repo: yup.string().required(`GitHub 仓库不能为空`),
  branch: yup.string().optional(),
  accessToken: yup.string().required(`GitHub Token 不能为空`),
  useCDN: yup.boolean().required(),
}))

const config = secureStore.reactiveJSON(`githubConfig`, { repo: ``, branch: ``, accessToken: ``, useCDN: false })

async function onSubmit(values: Record<string, unknown>) {
  Object.assign(config.value, values)
  toast.success(`保存成功`)
}
</script>

<template>
  <Form :validation-schema="schema" :initial-values="config" class="flex flex-col flex-1 overflow-hidden" @submit="onSubmit">
    <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <Field v-slot="{ field, errorMessage }" name="repo">
        <FormItem label="GitHub 仓库" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：github.com/yanglbme/resource" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="branch">
        <FormItem label="分支" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：release，可不填，默认 master" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="accessToken">
        <FormItem label="Token" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" type="password" placeholder="如：cc1d0c1426d0fd0902bd2d7184b14da61b8abc46" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="useCDN" type="boolean">
        <FormItem label="CDN 加速" :error="errorMessage">
          <Switch
            :checked="field.value"
            :name="field.name"
            @update:checked="field.onChange"
            @blur="field.onBlur"
          />
        </FormItem>
      </Field>

      <FormItem>
        <Button
          variant="link"
          class="p-0 h-auto text-left whitespace-normal"
          as="a"
          href="https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token"
          target="_blank"
        >
          如何获取 GitHub Token？
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
