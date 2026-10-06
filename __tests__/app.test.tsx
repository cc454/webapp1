import React from "react";
import renderer, { act } from "react-test-renderer";

const native = (name: string) => ({ children, ...props }: any) => React.createElement(name, props, children);
jest.mock("react-native", () => ({
  Alert: { alert: jest.fn() }, Modal: native("Modal"), Pressable: native("Pressable"), SafeAreaView: native("SafeAreaView"), ScrollView: native("ScrollView"), StatusBar: native("StatusBar"), Text: native("Text"), TextInput: native("TextInput"), View: native("View"), StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock("../src/storage", () => ({ loadState: jest.fn().mockResolvedValue({}), saveState: jest.fn(), getApiKey: jest.fn().mockResolvedValue(null), getGarminPassword: jest.fn(), saveApiKey: jest.fn(), saveGarminPassword: jest.fn() }));
jest.mock("../src/exports", () => ({ shareExport: jest.fn() }));
jest.mock("../src/garmin", () => ({ GarminError: Error, pullActivitySummaries: jest.fn(), pushWeekToCalendar: jest.fn(), signIn: jest.fn() }));
jest.mock("../src/markdown", () => ({ loadBundledMarkdown: jest.fn(), pickMarkdownFile: jest.fn() }));
jest.mock("../src/llm", () => ({ askCoach: jest.fn(), buildCoachContext: jest.fn().mockReturnValue("context") }));

import App from "../App";

describe("App", () => {
  it("renders the initial plan and persists loaded state", async () => {
    let tree: renderer.ReactTestRenderer;
    await act(async () => { tree = renderer.create(<App />); });
    const textValues = tree!.root.findAll(() => true).map((node) => node.props.children);
    expect(textValues).toContain("This week");
    expect(JSON.stringify(tree!.toJSON())).toContain("STRIDE");
  });
});
