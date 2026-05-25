<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup'
import { Field, Form } from 'vee-validate'
import * as yup from 'yup'
import { secureStore } from '@/utils/secureStore'
import { toast } from '@/utils/toast'

// 当前是否为网页（http/https 协议）
const isWebsite = window.location.protocol.startsWith(`http`)
// Cloudflare Workers 环境
const isCfWorkers = import.meta.env.CF_WORKERS === `1`
// 插件模式（如 chrome-extension://）
const isPluginMode = !isWebsite

// 是否需要填写 proxyOrigin（只在 非插件 且 非 CF 页面 时需要）
const isProxyRequired = computed(() => !isPluginMode && !isCfWorkers)

const placeholder = computed(() => (isProxyRequired.value ? `如：http://proxy.example.com` : `可不填`))

const schema = computed(() =>
  toTypedSchema(yup.object({
    proxyOrigin: isProxyRequired.value
      ? yup.string().required(`代理域名不能为空`)
      : yup.string().optional(),
    appID: yup.string().required(`AppID 不能为空`),
    appsecret: yup.string().required(`AppSecret 不能为空`),
  })),
)

const config = secureStore.reactiveJSON(`mpConfig`, {
  proxyOrigin: ``,
  appID: ``,
  appsecret: ``,
})

async function onSubmit(values: Record<string, unknown>) {
  Object.assign(config.value, values)
  toast.success(`保存成功`)
}
</script>

<template>
  <Form :validation-schema="schema" :initial-values="config" class="flex flex-col flex-1 overflow-hidden" @submit="onSubmit">
    <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <!-- 只有在需要代理时才显示 proxyOrigin 字段 -->
      <Field v-if="isProxyRequired" v-slot="{ field, errorMessage }" name="proxyOrigin">
        <FormItem label="代理域名" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" :placeholder="placeholder" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="appID">
        <FormItem label="appID" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：wx6e1234567890efa3" />
        </FormItem>
      </Field>

      <Field v-slot="{ field, errorMessage }" name="appsecret">
        <FormItem label="appsecret" required :error="errorMessage">
          <Input v-bind="field" v-model="field.value" placeholder="如：d9f1abcdef01234567890abcdef82397" />
        </FormItem>
      </Field>

      <FormItem>
        <div class="flex flex-col items-start">
          <Button
            variant="link"
            class="p-0 h-auto text-left whitespace-normal"
            as="a"
            href="https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Getting_Started_Guide.html"
            target="_blank"
          >
            如何开启公众号开发者模式并获取应用账号密钥？
          </Button>
          <Button
            variant="link"
            class="p-0 h-auto text-left whitespace-normal"
            as="a"
            href="https://md-pages.doocs.org/tutorial/"
            target="_blank"
          >
            如何在浏览器插件中使用公众号图床？
          </Button>
        </div>
      </FormItem>
    </div>

    <DialogFooter class="p-1">
      <Button type="submit">
        保存配置
      </Button>
    </DialogFooter>
  </Form>
</template>
