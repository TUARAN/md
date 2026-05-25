<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup'
import { Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { secureStore } from '@/utils/secureStore'
import { toast } from '@/utils/toast'

const schema = computed(() => toTypedSchema(
  yup.object({
    bucket: yup.string().required(`Bucket 不能为空`),
    operator: yup.string().required(`操作员 不能为空`),
    password: yup.string().required(`密码 不能为空`),
    domain: yup.string().required(`CDN 域名不能为空`),
    path: yup.string().optional(),
  }),
))

const config = secureStore.reactiveJSON(`upyunConfig`, {
  bucket: ``,
  operator: ``,
  password: ``,
  domain: ``,
  path: ``,
})

async function onSubmit(values: any) {
  Object.assign(config.value, values)
  toast.success(`保存成功`)
}
</script>

<template>
  <Form :validation-schema="schema" :initial-values="config" class="flex flex-col flex-1 overflow-hidden" @submit="onSubmit">
    <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <Field v-slot="{ field, errorMessage }" name="bucket">
        <FormItem label="Bucket" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如: md" class="w-full min-w-0 md:min-w-[350px]" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="operator">
        <FormItem label="操作员" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如: operator" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="password">
        <FormItem label="操作员密码" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" type="password" placeholder="如: c1c4dbcb0b6b785ac6633422a06dff3dac055fe74fe40xj1b5c5fcf1bf128010" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="domain">
        <FormItem label="域名" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：http://xxx.test.upcdn.net" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="path">
        <FormItem label="存储路径" :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：img，可不填，默认为根目录" />
        </FormItem>
      </Field>

      <FormItem>
        <Button
          variant="link"
          class="p-0 h-auto text-left whitespace-normal"
          as="a"
          href="https://help.upyun.com/"
          target="_blank"
        >
          如何使用 又拍云？
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
