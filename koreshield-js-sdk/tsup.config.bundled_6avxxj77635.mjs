// tsup.config.ts
import { defineConfig } from "tsup";
var tsup_config_default = defineConfig([
  // Main build for Node.js
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false,
    target: "es2022",
    external: ["axios", "react", "vue", "@angular/core", "rxjs", "rxjs/operators"],
    treeshake: true
  },
  // Browser-optimized build
  {
    entry: {
      "browser/index": "src/browser/client.ts"
    },
    format: ["iife", "esm"],
    globalName: "KoreShield",
    dts: true,
    sourcemap: true,
    minify: true,
    target: "es2020",
    treeshake: true,
    noExternal: [],
    platform: "browser"
  }
]);
export {
  tsup_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL3Nlc3Npb25zL3ByYWN0aWNhbC1zdG9pYy1oeXBhdGlhL21udC9rb3Jlc2hpZWxkL2tvcmVzaGllbGQtanMtc2RrL3RzdXAuY29uZmlnLnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9zZXNzaW9ucy9wcmFjdGljYWwtc3RvaWMtaHlwYXRpYS9tbnQva29yZXNoaWVsZC9rb3Jlc2hpZWxkLWpzLXNka1wiO2NvbnN0IF9faW5qZWN0ZWRfaW1wb3J0X21ldGFfdXJsX18gPSBcImZpbGU6Ly8vc2Vzc2lvbnMvcHJhY3RpY2FsLXN0b2ljLWh5cGF0aWEvbW50L2tvcmVzaGllbGQva29yZXNoaWVsZC1qcy1zZGsvdHN1cC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd0c3VwJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoW1xuICAvLyBNYWluIGJ1aWxkIGZvciBOb2RlLmpzXG4gIHtcbiAgICBlbnRyeTogWydzcmMvaW5kZXgudHMnXSxcbiAgICBmb3JtYXQ6IFsnY2pzJywgJ2VzbSddLFxuICAgIGR0czogdHJ1ZSxcbiAgICBzcGxpdHRpbmc6IGZhbHNlLFxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICBjbGVhbjogdHJ1ZSxcbiAgICBtaW5pZnk6IGZhbHNlLFxuICAgIHRhcmdldDogJ2VzMjAyMicsXG4gICAgZXh0ZXJuYWw6IFsnYXhpb3MnLCAncmVhY3QnLCAndnVlJywgJ0Bhbmd1bGFyL2NvcmUnLCAncnhqcycsICdyeGpzL29wZXJhdG9ycyddLFxuICAgIHRyZWVzaGFrZTogdHJ1ZSxcbiAgfSxcbiAgLy8gQnJvd3Nlci1vcHRpbWl6ZWQgYnVpbGRcbiAge1xuICAgIGVudHJ5OiB7XG4gICAgICAnYnJvd3Nlci9pbmRleCc6ICdzcmMvYnJvd3Nlci9jbGllbnQudHMnXG4gICAgfSxcbiAgICBmb3JtYXQ6IFsnaWlmZScsICdlc20nXSxcbiAgICBnbG9iYWxOYW1lOiAnS29yZVNoaWVsZCcsXG4gICAgZHRzOiB0cnVlLFxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICBtaW5pZnk6IHRydWUsXG4gICAgdGFyZ2V0OiAnZXMyMDIwJyxcbiAgICB0cmVlc2hha2U6IHRydWUsXG4gICAgbm9FeHRlcm5hbDogW10sXG4gICAgcGxhdGZvcm06ICdicm93c2VyJyxcbiAgfVxuXSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQW9WLFNBQVMsb0JBQW9CO0FBRWpYLElBQU8sc0JBQVEsYUFBYTtBQUFBO0FBQUEsRUFFMUI7QUFBQSxJQUNFLE9BQU8sQ0FBQyxjQUFjO0FBQUEsSUFDdEIsUUFBUSxDQUFDLE9BQU8sS0FBSztBQUFBLElBQ3JCLEtBQUs7QUFBQSxJQUNMLFdBQVc7QUFBQSxJQUNYLFdBQVc7QUFBQSxJQUNYLE9BQU87QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLFVBQVUsQ0FBQyxTQUFTLFNBQVMsT0FBTyxpQkFBaUIsUUFBUSxnQkFBZ0I7QUFBQSxJQUM3RSxXQUFXO0FBQUEsRUFDYjtBQUFBO0FBQUEsRUFFQTtBQUFBLElBQ0UsT0FBTztBQUFBLE1BQ0wsaUJBQWlCO0FBQUEsSUFDbkI7QUFBQSxJQUNBLFFBQVEsQ0FBQyxRQUFRLEtBQUs7QUFBQSxJQUN0QixZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsSUFDTCxXQUFXO0FBQUEsSUFDWCxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxZQUFZLENBQUM7QUFBQSxJQUNiLFVBQVU7QUFBQSxFQUNaO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
